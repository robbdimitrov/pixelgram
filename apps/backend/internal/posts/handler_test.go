package posts

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/robbdimitrov/pixelgram/apps/backend/internal/httpx"
)

type fakeStore struct {
	post           Post
	posts          []Post
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

func (s *fakeStore) CreatePost(_ context.Context, _ string, _ string, _ *string) (int, bool, error) {
	return s.createdID, s.created, s.err
}

func (s *fakeStore) GetFeed(_ context.Context, page, limit int, _ string) ([]Post, error) {
	s.requestedPage = page
	s.requestedLimit = limit
	return s.posts, s.err
}

func (s *fakeStore) GetPosts(_ context.Context, _ string, _ int, _ int, _ string) ([]Post, error) {
	return s.posts, s.err
}

func (s *fakeStore) GetLikedPosts(_ context.Context, _ string, _ int, _ int, _ string) ([]Post, error) {
	return s.posts, s.err
}

func (s *fakeStore) GetPost(_ context.Context, _ string, _ string) (Post, bool, error) {
	return s.post, s.found, s.err
}

func (s *fakeStore) DeletePost(_ context.Context, _ string, _ string) (string, bool, error) {
	return s.deletedFile, s.deleted, s.err
}

func (s *fakeStore) PostExists(_ context.Context, _ string) (bool, error) {
	return s.exists, s.err
}

func (s *fakeStore) LikePost(_ context.Context, _ string, _ string) error {
	s.liked = true
	return s.err
}

func (s *fakeStore) UnlikePost(_ context.Context, _ string, _ string) error {
	s.unliked = true
	return s.err
}

func TestCreatePostMissingFilename(t *testing.T) {
	handler := Handler{Store: &fakeStore{}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/posts", strings.NewReader(`{}`))
	req = httpx.WithUserID(req, "1")

	handler.CreatePost(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
	if !strings.Contains(res.Body.String(), "Post filename is required.") {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestCreatePostInvalidUpload(t *testing.T) {
	handler := Handler{Store: &fakeStore{created: false}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/posts", strings.NewReader(`{"filename":"upload"}`))
	req = httpx.WithUserID(req, "1")

	handler.CreatePost(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
	if !strings.Contains(res.Body.String(), "Upload is invalid or expired.") {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestCreatePostSuccess(t *testing.T) {
	handler := Handler{Store: &fakeStore{createdID: 8, created: true}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/posts", strings.NewReader(`{"filename":"upload","description":"hi"}`))
	req = httpx.WithUserID(req, "1")

	handler.CreatePost(res, req)

	if res.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusCreated)
	}
	if strings.TrimSpace(res.Body.String()) != `{"id":8}` {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestGetFeedPagination(t *testing.T) {
	store := &fakeStore{posts: []Post{{ID: 1, Filename: "a"}}}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/posts?page=2&limit=500", nil)
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
	req := httptest.NewRequest(http.MethodGet, "/posts?page=-1", nil)
	req = httpx.WithUserID(req, "1")

	handler.GetFeed(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
}

func TestGetPostNotFound(t *testing.T) {
	handler := Handler{Store: &fakeStore{}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/posts/99", nil)
	req.SetPathValue("postId", "99")
	req = httpx.WithUserID(req, "1")

	handler.GetPost(res, req)

	if res.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNotFound)
	}
}

func TestDeletePostDeletesFile(t *testing.T) {
	dir := t.TempDir()
	filename := "post-file"
	if err := os.WriteFile(filepath.Join(dir, filename), []byte("image"), 0o600); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	handler := Handler{Store: &fakeStore{deleted: true, deletedFile: filename}, ImageDir: dir}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/posts/1", nil)
	req.SetPathValue("postId", "1")
	req = httpx.WithUserID(req, "1")

	handler.DeletePost(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNoContent)
	}
	if _, err := os.Stat(filepath.Join(dir, filename)); !os.IsNotExist(err) {
		t.Fatalf("expected file deletion, stat err=%v", err)
	}
}

func TestDeletePostForbidden(t *testing.T) {
	handler := Handler{Store: &fakeStore{found: true}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/posts/1", nil)
	req.SetPathValue("postId", "1")
	req = httpx.WithUserID(req, "2")

	handler.DeletePost(res, req)

	if res.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusForbidden)
	}
}

func TestLikePostNotFound(t *testing.T) {
	handler := Handler{Store: &fakeStore{exists: false}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/posts/1/likes", nil)
	req.SetPathValue("postId", "1")
	req = httpx.WithUserID(req, "2")

	handler.LikePost(res, req)

	if res.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNotFound)
	}
}

func TestUnlikePostSuccess(t *testing.T) {
	store := &fakeStore{exists: true}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/posts/1/likes", nil)
	req.SetPathValue("postId", "1")
	req = httpx.WithUserID(req, "2")

	handler.UnlikePost(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNoContent)
	}
	if !store.unliked {
		t.Fatal("expected UnlikePost store call")
	}
}

func TestLikePostSuccess(t *testing.T) {
	store := &fakeStore{exists: true}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/posts/1/likes", nil)
	req.SetPathValue("postId", "1")
	req = httpx.WithUserID(req, "2")

	handler.LikePost(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNoContent)
	}
	if !store.liked {
		t.Fatal("expected LikePost store call")
	}
}
