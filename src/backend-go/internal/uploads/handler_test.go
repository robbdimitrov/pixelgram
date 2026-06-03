package uploads

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"pixelgram/backend/internal/httpx"
)

type fakeStore struct {
	expired     []string
	capacity    bool
	err         error
	created     bool
	createdUser string
	filename    string
}

func (s *fakeStore) DeleteExpiredUploads() ([]string, error) {
	return s.expired, s.err
}

func (s *fakeStore) HasPendingUploadCapacity(string) (bool, error) {
	return s.capacity, s.err
}

func (s *fakeStore) CreateUpload(userID, filename string) error {
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
