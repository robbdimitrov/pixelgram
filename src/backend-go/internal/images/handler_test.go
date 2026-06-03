package images

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"pixelgram/backend/internal/httpx"
)

type fakeStore struct {
	image          Image
	images         []Image
	found          bool
	err            error
	createdID      int
	created        bool
	deleted        bool
	deletedFile    string
	exists         bool
	liked          bool
	unliked        bool
	requestedPage  int
	requestedLimit int
}

func (s *fakeStore) CreateImage(string, string, *string) (int, bool, error) {
	return s.createdID, s.created, s.err
}

func (s *fakeStore) GetFeed(page, limit int, _ string) ([]Image, error) {
	s.requestedPage = page
	s.requestedLimit = limit
	return s.images, s.err
}

func (s *fakeStore) GetImages(string, int, int, string) ([]Image, error) {
	return s.images, s.err
}

func (s *fakeStore) GetLikedImages(string, int, int, string) ([]Image, error) {
	return s.images, s.err
}

func (s *fakeStore) GetImage(string, string) (Image, bool, error) {
	return s.image, s.found, s.err
}

func (s *fakeStore) DeleteImage(string, string) (string, bool, error) {
	return s.deletedFile, s.deleted, s.err
}

func (s *fakeStore) ImageExists(string) (bool, error) {
	return s.exists, s.err
}

func (s *fakeStore) LikeImage(string, string) error {
	s.liked = true
	return s.err
}

func (s *fakeStore) UnlikeImage(string, string) error {
	s.unliked = true
	return s.err
}

func TestCreateImageMissingFilename(t *testing.T) {
	handler := Handler{Store: &fakeStore{}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/images", strings.NewReader(`{}`))
	req = httpx.WithUserID(req, "1")

	handler.CreateImage(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
	if !strings.Contains(res.Body.String(), "Image filename is required.") {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestCreateImageInvalidUpload(t *testing.T) {
	handler := Handler{Store: &fakeStore{created: false}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/images", strings.NewReader(`{"filename":"upload"}`))
	req = httpx.WithUserID(req, "1")

	handler.CreateImage(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
	if !strings.Contains(res.Body.String(), "Upload is invalid or expired.") {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestCreateImageSuccess(t *testing.T) {
	handler := Handler{Store: &fakeStore{createdID: 8, created: true}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/images", strings.NewReader(`{"filename":"upload","description":"hi"}`))
	req = httpx.WithUserID(req, "1")

	handler.CreateImage(res, req)

	if res.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusCreated)
	}
	if strings.TrimSpace(res.Body.String()) != `{"id":8}` {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestGetFeedPagination(t *testing.T) {
	store := &fakeStore{images: []Image{{ID: 1, Filename: "a"}}}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/images?page=2&limit=500", nil)
	req = httpx.WithUserID(req, "1")

	handler.GetFeed(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if store.requestedPage != 2 || store.requestedLimit != 50 {
		t.Fatalf("pagination = page %d limit %d", store.requestedPage, store.requestedLimit)
	}
	if !strings.Contains(res.Body.String(), `"items"`) {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestGetFeedInvalidPagination(t *testing.T) {
	handler := Handler{Store: &fakeStore{}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/images?page=-1", nil)
	req = httpx.WithUserID(req, "1")

	handler.GetFeed(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
}

func TestGetImageNotFound(t *testing.T) {
	handler := Handler{Store: &fakeStore{}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/images/99", nil)
	req.SetPathValue("imageId", "99")
	req = httpx.WithUserID(req, "1")

	handler.GetImage(res, req)

	if res.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNotFound)
	}
}

func TestDeleteImageDeletesFile(t *testing.T) {
	dir := t.TempDir()
	filename := "image-file"
	if err := os.WriteFile(filepath.Join(dir, filename), []byte("image"), 0o600); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	handler := Handler{Store: &fakeStore{deleted: true, deletedFile: filename}, ImageDir: dir}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/images/1", nil)
	req.SetPathValue("imageId", "1")
	req = httpx.WithUserID(req, "1")

	handler.DeleteImage(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNoContent)
	}
	if _, err := os.Stat(filepath.Join(dir, filename)); !os.IsNotExist(err) {
		t.Fatalf("expected file deletion, stat err=%v", err)
	}
}

func TestDeleteImageForbidden(t *testing.T) {
	handler := Handler{Store: &fakeStore{found: true}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/images/1", nil)
	req.SetPathValue("imageId", "1")
	req = httpx.WithUserID(req, "2")

	handler.DeleteImage(res, req)

	if res.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusForbidden)
	}
}

func TestLikeImageNotFound(t *testing.T) {
	handler := Handler{Store: &fakeStore{exists: false}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/images/1/likes", nil)
	req.SetPathValue("imageId", "1")
	req = httpx.WithUserID(req, "2")

	handler.LikeImage(res, req)

	if res.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNotFound)
	}
}

func TestLikeImageSuccess(t *testing.T) {
	store := &fakeStore{exists: true}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/images/1/likes", nil)
	req.SetPathValue("imageId", "1")
	req = httpx.WithUserID(req, "2")

	handler.LikeImage(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNoContent)
	}
	if !store.liked {
		t.Fatal("expected LikeImage store call")
	}
}
