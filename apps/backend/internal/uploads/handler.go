package uploads

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/robbdimitrov/pixelgram/apps/backend/internal/httpx"
)

const fileLimit = 1_000_000

type Store interface {
	DeleteExpiredUploads(ctx context.Context) ([]string, error)
	HasPendingUploadCapacity(ctx context.Context, userID string) (bool, error)
	CreateUpload(ctx context.Context, userID, filename string) error
}

type Handler struct {
	Store    Store
	ImageDir string
}

func (h Handler) CreateFile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, _ := httpx.UserID(r)
	filename, err := h.saveMultipartImage(r)
	if err != nil {
		status, message := uploadErrorResponse(err)
		httpx.WriteMessage(w, status, message)
		return
	}

	path := uploadPath(h.ImageDir, filename)
	f, err := os.Open(path)
	if err != nil {
		DeleteUploadFile(h.ImageDir, filename)
		httpx.WriteMessage(w, http.StatusBadRequest, "Could not process upload.")
		return
	}
	header := make([]byte, 12)
	n, _ := f.Read(header)
	f.Close()
	if !isImage(header[:n]) {
		DeleteUploadFile(h.ImageDir, filename)
		httpx.WriteMessage(w, http.StatusBadRequest, "Only image uploads are allowed.")
		return
	}

	expired, err := h.Store.DeleteExpiredUploads(ctx)
	if err != nil {
		DeleteUploadFile(h.ImageDir, filename)
		httpx.WriteMessage(w, http.StatusBadRequest, "Could not process upload.")
		return
	}
	deleteUploadFiles(h.ImageDir, expired)

	hasCapacity, err := h.Store.HasPendingUploadCapacity(ctx, userID)
	if err != nil {
		DeleteUploadFile(h.ImageDir, filename)
		httpx.WriteMessage(w, http.StatusBadRequest, "Could not process upload.")
		return
	}
	if !hasCapacity {
		DeleteUploadFile(h.ImageDir, filename)
		httpx.WriteMessage(w, http.StatusTooManyRequests, "Too many pending uploads. Create posts with existing uploads or try again later.")
		return
	}

	if err := h.Store.CreateUpload(ctx, userID, filename); err != nil {
		DeleteUploadFile(h.ImageDir, filename)
		httpx.WriteMessage(w, http.StatusBadRequest, "Could not process upload.")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]string{"filename": filename})
}

func (h Handler) saveMultipartImage(r *http.Request) (string, error) {
	reader, err := r.MultipartReader()
	if err != nil {
		return "", errProcessUpload
	}

	var imagePart io.Reader
	for {
		part, err := reader.NextPart()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return "", errProcessUpload
		}
		if part.FormName() == "image" {
			imagePart = part
			break
		}
	}
	if imagePart == nil {
		return "", errMissingFile
	}

	filename, err := randomFilename()
	if err != nil {
		return "", errProcessUpload
	}
	if err := os.MkdirAll(h.ImageDir, 0o755); err != nil {
		return "", errProcessUpload
	}

	file, err := os.OpenFile(uploadPath(h.ImageDir, filename), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return "", errProcessUpload
	}
	defer file.Close()

	written, err := io.Copy(file, io.LimitReader(imagePart, fileLimit+1))
	if err != nil {
		DeleteUploadFile(h.ImageDir, filename)
		return "", errProcessUpload
	}
	if written > fileLimit {
		DeleteUploadFile(h.ImageDir, filename)
		return "", errFileTooLarge
	}

	return filename, nil
}

func (h Handler) ServeFile(w http.ResponseWriter, r *http.Request) {
	filename, ok := uploadFilename(r.URL.Path)
	if !ok {
		http.NotFound(w, r)
		return
	}

	file, err := os.Open(uploadPath(h.ImageDir, filename))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Cache-Control", "private, max-age=86400")
	w.Header().Set("ETag", `"`+filename+`"`)
	http.ServeContent(w, r, filename, info.ModTime(), file)
}

func uploadFilename(path string) (string, bool) {
	filename, ok := strings.CutPrefix(path, "/uploads/")
	if !ok || len(filename) != 32 {
		return "", false
	}
	for _, char := range filename {
		if !('0' <= char && char <= '9') && !('a' <= char && char <= 'f') {
			return "", false
		}
	}
	return filename, true
}

func uploadPath(imageDir, filename string) string {
	return filepath.Join(imageDir, filepath.Base(filename))
}

func DeleteUploadFile(imageDir, filename string) {
	_ = os.Remove(uploadPath(imageDir, filename))
}

func deleteUploadFiles(imageDir string, filenames []string) {
	for _, filename := range filenames {
		DeleteUploadFile(imageDir, filename)
	}
}

func randomFilename() (string, error) {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes[:]), nil
}

func uploadErrorResponse(err error) (int, string) {
	switch {
	case errors.Is(err, errMissingFile):
		return http.StatusBadRequest, "File missing from request."
	case errors.Is(err, errFileTooLarge):
		return http.StatusRequestEntityTooLarge, "Could not resize this image enough. Try a smaller image."
	default:
		return http.StatusBadRequest, "Could not process upload."
	}
}

var (
	errMissingFile   = errors.New("file missing")
	errFileTooLarge  = errors.New("file too large")
	errProcessUpload = errors.New("could not process upload")
)

type signature struct {
	bytes     []byte
	offset    int
	secondary *signature
}

var signatures = []signature{
	{bytes: []byte{0xff, 0xd8, 0xff}},
	{bytes: []byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}},
	{bytes: []byte{0x47, 0x49, 0x46, 0x38}},
	{
		bytes:  []byte{0x52, 0x49, 0x46, 0x46},
		offset: 0,
		secondary: &signature{
			bytes:  []byte{0x57, 0x45, 0x42, 0x50},
			offset: 8,
		},
	},
}

func isImage(buffer []byte) bool {
	for _, candidate := range signatures {
		if !hasBytes(buffer, candidate.bytes, candidate.offset) {
			continue
		}
		if candidate.secondary == nil || hasBytes(buffer, candidate.secondary.bytes, candidate.secondary.offset) {
			return true
		}
	}
	return false
}

func hasBytes(buffer, bytes []byte, offset int) bool {
	if len(buffer) < offset+len(bytes) {
		return false
	}
	for i, b := range bytes {
		if buffer[offset+i] != b {
			return false
		}
	}
	return true
}
