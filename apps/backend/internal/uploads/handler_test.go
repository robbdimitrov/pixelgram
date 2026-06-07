package uploads

import (
	"bytes"
	"context"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/robbdimitrov/pixelgram/apps/backend/internal/httpx"
)

type fakeStore struct {
	expired     []string
	capacity    bool
	err         error
	created     bool
	createdUser string
	filename    string
}

func (s *fakeStore) DeleteExpiredUploads(_ context.Context) ([]string, error) {
	return s.expired, s.err
}

func (s *fakeStore) HasPendingUploadCapacity(_ context.Context, _ string) (bool, error) {
	return s.capacity, s.err
}

func (s *fakeStore) CreateUpload(_ context.Context, userID, filename string) error {
	s.created = true
	s.createdUser = userID
	s.filename = filename
	return s.err
}

func TestCreateFileMissingFile(t *testing.T) {
	handler := Handler{Store: &fakeStore{capacity: true}, ImageDir: t.TempDir()}
	req, err := multipartRequest(nil)
	if err != nil {
		t.Fatalf("multipartRequest returned error: %v", err)
	}
	req = httpx.WithUserID(req, "1")
	res := httptest.NewRecorder()

	handler.CreateFile(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
	if !strings.Contains(res.Body.String(), "File missing from request.") {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestCreateFileRejectsNonImage(t *testing.T) {
	store := &fakeStore{capacity: true}
	handler := Handler{Store: store, ImageDir: t.TempDir()}
	req, err := multipartRequest([]byte("not an image"))
	if err != nil {
		t.Fatalf("multipartRequest returned error: %v", err)
	}
	req = httpx.WithUserID(req, "1")
	res := httptest.NewRecorder()

	handler.CreateFile(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
	if store.created {
		t.Fatal("non-image upload should not create DB upload")
	}
	if !strings.Contains(res.Body.String(), "Only image uploads are allowed.") {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestCreateFileAcceptsImageSignature(t *testing.T) {
	store := &fakeStore{capacity: true}
	handler := Handler{Store: store, ImageDir: t.TempDir()}
	req, err := multipartRequest([]byte{0xff, 0xd8, 0xff, 0x00})
	if err != nil {
		t.Fatalf("multipartRequest returned error: %v", err)
	}
	req = httpx.WithUserID(req, "1")
	res := httptest.NewRecorder()

	handler.CreateFile(res, req)

	if res.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d; body=%s", res.Code, http.StatusCreated, res.Body.String())
	}
	if !store.created || store.createdUser != "1" || store.filename == "" {
		t.Fatalf("store create = %v user=%q filename=%q", store.created, store.createdUser, store.filename)
	}
	if _, err := os.Stat(filepath.Join(handler.ImageDir, store.filename)); err != nil {
		t.Fatalf("expected uploaded file to exist: %v", err)
	}
}

func TestCreateFileDeletesExpiredUploads(t *testing.T) {
	dir := t.TempDir()
	expired := "expired-upload"
	if err := os.WriteFile(filepath.Join(dir, expired), []byte{0xff, 0xd8, 0xff}, 0o600); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	store := &fakeStore{capacity: true, expired: []string{expired}}
	handler := Handler{Store: store, ImageDir: dir}
	req, err := multipartRequest([]byte{0xff, 0xd8, 0xff, 0x00})
	if err != nil {
		t.Fatalf("multipartRequest returned error: %v", err)
	}
	req = httpx.WithUserID(req, "1")
	res := httptest.NewRecorder()

	handler.CreateFile(res, req)

	if res.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusCreated)
	}
	if _, err := os.Stat(filepath.Join(dir, expired)); !os.IsNotExist(err) {
		t.Fatalf("expected expired upload to be deleted, stat err=%v", err)
	}
}

func TestCreateFileRejectsQuotaExhaustion(t *testing.T) {
	store := &fakeStore{capacity: false}
	handler := Handler{Store: store, ImageDir: t.TempDir()}
	req, err := multipartRequest([]byte{0xff, 0xd8, 0xff, 0x00})
	if err != nil {
		t.Fatalf("multipartRequest returned error: %v", err)
	}
	req = httpx.WithUserID(req, "1")
	res := httptest.NewRecorder()

	handler.CreateFile(res, req)

	if res.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusTooManyRequests)
	}
	if store.created {
		t.Fatal("quota rejection should not create DB upload")
	}
}

func TestCreateFileRejectsOversizedUpload(t *testing.T) {
	handler := Handler{Store: &fakeStore{capacity: true}, ImageDir: t.TempDir()}
	req, err := multipartRequest(append([]byte{0xff, 0xd8, 0xff}, bytes.Repeat([]byte("x"), fileLimit)...))
	if err != nil {
		t.Fatalf("multipartRequest returned error: %v", err)
	}
	req = httpx.WithUserID(req, "1")
	res := httptest.NewRecorder()

	handler.CreateFile(res, req)

	if res.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusRequestEntityTooLarge)
	}
}

func TestServeFile(t *testing.T) {
	dir := t.TempDir()
	filename := "0123456789abcdef0123456789abcdef"
	content := []byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00}
	modTime := time.Date(2026, time.June, 1, 12, 0, 0, 0, time.UTC)
	path := filepath.Join(dir, filename)
	if err := os.WriteFile(path, content, 0o600); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	if err := os.Chtimes(path, modTime, modTime); err != nil {
		t.Fatalf("Chtimes returned error: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/uploads/"+filename, nil)
	res := httptest.NewRecorder()

	Handler{ImageDir: dir}.ServeFile(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if !bytes.Equal(res.Body.Bytes(), content) {
		t.Fatalf("body = %v, want %v", res.Body.Bytes(), content)
	}
	if got := res.Header().Get("ETag"); got != `"`+filename+`"` {
		t.Errorf("ETag = %q", got)
	}
	if got := res.Header().Get("Cache-Control"); got != "private, max-age=86400" {
		t.Errorf("Cache-Control = %q", got)
	}
	if got := res.Header().Get("Content-Type"); got != "image/png" {
		t.Errorf("Content-Type = %q", got)
	}
	if got := res.Header().Get("Last-Modified"); got != modTime.Format(http.TimeFormat) {
		t.Errorf("Last-Modified = %q", got)
	}
}

func TestServeFileHonorsIfNoneMatch(t *testing.T) {
	dir := t.TempDir()
	filename := "0123456789abcdef0123456789abcdef"
	if err := os.WriteFile(filepath.Join(dir, filename), []byte("content"), 0o600); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	req := httptest.NewRequest(http.MethodGet, "/uploads/"+filename, nil)
	req.Header.Set("If-None-Match", `"`+filename+`"`)
	res := httptest.NewRecorder()

	Handler{ImageDir: dir}.ServeFile(res, req)

	if res.Code != http.StatusNotModified {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNotModified)
	}
	if res.Body.Len() != 0 {
		t.Fatalf("body = %q, want empty", res.Body.String())
	}
}

func TestServeFileIgnoresNonMatchingETag(t *testing.T) {
	dir := t.TempDir()
	filename := "0123456789abcdef0123456789abcdef"
	content := []byte("complete content")
	if err := os.WriteFile(filepath.Join(dir, filename), content, 0o600); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	req := httptest.NewRequest(http.MethodGet, "/uploads/"+filename, nil)
	req.Header.Set("If-None-Match", `"different"`)
	res := httptest.NewRecorder()

	Handler{ImageDir: dir}.ServeFile(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if !bytes.Equal(res.Body.Bytes(), content) {
		t.Fatalf("body = %q, want %q", res.Body.Bytes(), content)
	}
}

func TestServeFileRejectsInvalidOrMissingFiles(t *testing.T) {
	dir := t.TempDir()
	filename := "0123456789abcdef0123456789abcdef"
	if err := os.Mkdir(filepath.Join(dir, filename), 0o700); err != nil {
		t.Fatalf("Mkdir returned error: %v", err)
	}

	for _, path := range []string{
		"/uploads/",
		"/uploads/not-a-valid-filename",
		"/uploads/0123456789ABCDEF0123456789ABCDEF",
		"/uploads/" + filename + "/extra",
		"/uploads/fedcba9876543210fedcba9876543210",
		"/uploads/" + filename,
	} {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			res := httptest.NewRecorder()

			Handler{ImageDir: dir}.ServeFile(res, req)

			if res.Code != http.StatusNotFound {
				t.Fatalf("status = %d, want %d", res.Code, http.StatusNotFound)
			}
		})
	}
}

func TestServeFileSupportsRanges(t *testing.T) {
	dir := t.TempDir()
	filename := "0123456789abcdef0123456789abcdef"
	if err := os.WriteFile(filepath.Join(dir, filename), []byte("0123456789"), 0o600); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	req := httptest.NewRequest(http.MethodGet, "/uploads/"+filename, nil)
	req.Header.Set("Range", "bytes=2-5")
	res := httptest.NewRecorder()

	Handler{ImageDir: dir}.ServeFile(res, req)

	if res.Code != http.StatusPartialContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusPartialContent)
	}
	if got := res.Body.String(); got != "2345" {
		t.Fatalf("body = %q, want %q", got, "2345")
	}
	if got := res.Header().Get("Content-Range"); got != "bytes 2-5/10" {
		t.Errorf("Content-Range = %q", got)
	}
}

func multipartRequest(file []byte) (*http.Request, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	if file != nil {
		part, err := writer.CreateFormFile("image", "test.jpg")
		if err != nil {
			return nil, err
		}
		if _, err := part.Write(file); err != nil {
			return nil, err
		}
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}

	req := httptest.NewRequest(http.MethodPost, "/uploads", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req, nil
}
