package comments

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"phasma/backend/internal/pagination"
)

const testPublicID = "550e8400-e29b-41d4-a716-446655440000"

type fakeStore struct {
	requestedPostID string
	requestedCursor *pagination.Cursor
	requestedLimit  int
}

func (s *fakeStore) CreateComment(context.Context, string, string, string) (Comment, error) {
	return Comment{}, nil
}

func (s *fakeStore) ListComments(_ context.Context, postID string, cursor *pagination.Cursor, limit int) ([]Comment, *pagination.Cursor, error) {
	s.requestedPostID = postID
	s.requestedCursor = cursor
	s.requestedLimit = limit
	return []Comment{}, nil, nil
}

func (s *fakeStore) DeleteComment(context.Context, string, string, string) (bool, error) {
	return false, nil
}

func TestListCommentsPagination(t *testing.T) {
	cursor := pagination.Cursor{Created: time.Date(2026, 6, 15, 10, 0, 0, 0, time.UTC), ID: 42}
	store := &fakeStore{}
	handler := Handler{Service: NewService(store)}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/posts/"+testPublicID+"/comments?cursor="+pagination.EncodeCursor(cursor)+"&limit=25", nil)
	req.SetPathValue("publicId", testPublicID)

	handler.ListComments(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if store.requestedPostID != testPublicID || store.requestedCursor == nil || *store.requestedCursor != cursor || store.requestedLimit != 25 {
		t.Fatalf(
			"request = post %q cursor %+v limit %d",
			store.requestedPostID, store.requestedCursor, store.requestedLimit,
		)
	}
}
