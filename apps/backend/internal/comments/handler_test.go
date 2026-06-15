package comments

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pixelgram/backend/internal/compat"
)

const testPublicID = "550e8400-e29b-41d4-a716-446655440000"

type fakeStore struct {
	requestedPostID string
	requestedCursor *compat.Cursor
	requestedLimit  int
}

func (s *fakeStore) PostExists(context.Context, string) (bool, error) {
	return true, nil
}

func (s *fakeStore) CreateComment(context.Context, string, string, string) (Comment, error) {
	return Comment{}, nil
}

func (s *fakeStore) ListComments(_ context.Context, postID string, cursor *compat.Cursor, limit int) ([]Comment, *compat.Cursor, error) {
	s.requestedPostID = postID
	s.requestedCursor = cursor
	s.requestedLimit = limit
	return []Comment{}, nil, nil
}

func (s *fakeStore) DeleteComment(context.Context, string, string, string) (bool, error) {
	return false, nil
}

func TestListCommentsPagination(t *testing.T) {
	cursor := compat.Cursor{Created: time.Date(2026, 6, 15, 10, 0, 0, 0, time.UTC), ID: 42}
	store := &fakeStore{}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/posts/"+testPublicID+"/comments?cursor="+compat.EncodeCursor(cursor)+"&limit=25", nil)
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
