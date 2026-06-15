package posts

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"pixelgram/backend/internal/compat"
	"pixelgram/backend/internal/httpx"
)

type fakeStore struct {
	post            Post
	posts           []Post
	found           bool
	err             error
	createdID       int
	created         bool
	deleted         bool
	deletedFile     string
	exists          bool
	liked           bool
	unliked         bool
	requestedUser   string
	requestedCursor *compat.Cursor
	requestedLimit  int
	nextCursor      *compat.Cursor
}

func (s *fakeStore) CreatePost(_ context.Context, _ string, _ string, _ *string) (int, bool, error) {
	return s.createdID, s.created, s.err
}

func (s *fakeStore) GetFeed(_ context.Context, cursor *compat.Cursor, limit int, _ string) ([]Post, *compat.Cursor, error) {
	s.requestedCursor = cursor
	s.requestedLimit = limit
	return s.posts, s.nextCursor, s.err
}

func (s *fakeStore) GetPosts(_ context.Context, userID string, cursor *compat.Cursor, limit int, _ string) ([]Post, *compat.Cursor, error) {
	s.requestedUser = userID
	s.requestedCursor = cursor
	s.requestedLimit = limit
	return s.posts, s.nextCursor, s.err
}

func (s *fakeStore) GetLikedPosts(_ context.Context, _ string, _ *compat.Cursor, _ int, _ string) ([]Post, *compat.Cursor, error) {
	return s.posts, s.nextCursor, s.err
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
	cursor := compat.Cursor{Created: time.Date(2026, 6, 15, 10, 0, 0, 0, time.UTC), ID: 42}
	nextCursor := compat.Cursor{Created: time.Date(2026, 6, 14, 10, 0, 0, 0, time.UTC), ID: 21}
	store := &fakeStore{
		posts:      []Post{{ID: 1, Filename: "a"}},
		nextCursor: &nextCursor,
	}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/posts?cursor="+compat.EncodeCursor(cursor)+"&limit=500", nil)
	req = httpx.WithUserID(req, "1")

	handler.GetFeed(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if store.requestedCursor == nil || *store.requestedCursor != cursor || store.requestedLimit != 50 {
		t.Fatalf("pagination = cursor %+v limit %d", store.requestedCursor, store.requestedLimit)
	}
	if !strings.Contains(res.Body.String(), `"nextCursor":"`+compat.EncodeCursor(nextCursor)+`"`) {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestGetFeedInvalidPagination(t *testing.T) {
	handler := Handler{Store: &fakeStore{}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/posts?cursor=invalid", nil)
	req = httpx.WithUserID(req, "1")

	handler.GetFeed(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
}

func TestGetPostsPagination(t *testing.T) {
	cursor := compat.Cursor{Created: time.Date(2026, 6, 15, 10, 0, 0, 0, time.UTC), ID: 42}
	store := &fakeStore{posts: []Post{{ID: 1, Filename: "a"}}}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/users/42/posts?cursor="+compat.EncodeCursor(cursor)+"&limit=25", nil)
	req.SetPathValue("userId", "42")
	req = httpx.WithUserID(req, "1")

	handler.GetPosts(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if store.requestedUser != "42" || store.requestedCursor == nil || *store.requestedCursor != cursor || store.requestedLimit != 25 {
		t.Fatalf(
			"request = user %q cursor %+v limit %d",
			store.requestedUser, store.requestedCursor, store.requestedLimit,
		)
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
