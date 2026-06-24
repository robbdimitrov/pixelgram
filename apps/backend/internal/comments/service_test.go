package comments

import (
	"context"
	"errors"
	"testing"

	"phasma/backend/internal/pagination"
	"phasma/backend/internal/store"
)

type serviceRepository struct {
	exists    bool
	deleted   bool
	deleteErr error
}

func (r *serviceRepository) PostExists(context.Context, string) (bool, error) {
	return r.exists, nil
}
func (r *serviceRepository) CreateComment(context.Context, string, string, string) (Comment, error) {
	return Comment{}, nil
}
func (r *serviceRepository) ListComments(context.Context, string, *pagination.Cursor, int) ([]Comment, *pagination.Cursor, error) {
	return []Comment{}, nil, nil
}
func (r *serviceRepository) DeleteComment(context.Context, string, string, string) (bool, error) {
	return r.deleted, r.deleteErr
}

func TestServiceListCommentsRequiresExistingPost(t *testing.T) {
	_, _, err := NewService(&serviceRepository{}).ListComments(
		context.Background(), ListQuery{PublicID: testPublicID, Limit: 10},
	)
	if !errors.Is(err, store.ErrNotFound) {
		t.Fatalf("ListComments() error = %v, want not found", err)
	}
}

func TestServiceDeleteCommentPreservesForbidden(t *testing.T) {
	service := NewService(&serviceRepository{deleteErr: store.ErrForbidden})
	err := service.DeleteComment(context.Background(), DeleteCommentCommand{
		PublicID: testPublicID, CommentID: "1", UserID: "2",
	})
	if !errors.Is(err, store.ErrForbidden) {
		t.Fatalf("DeleteComment() error = %v, want forbidden", err)
	}
}
