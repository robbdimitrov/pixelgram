package comments

import (
	"context"

	"phasma/backend/internal/pagination"
	"phasma/backend/internal/store"
)

type CreateCommentCommand struct {
	PublicID string
	UserID   string
	Body     string
}

type ListQuery struct {
	PublicID string
	Cursor   *pagination.Cursor
	Limit    int
}

type DeleteCommentCommand struct {
	PublicID  string
	CommentID string
	UserID    string
}

type Repository interface {
	CreateComment(ctx context.Context, publicID, userID, body string) (Comment, error)
	ListComments(ctx context.Context, publicID string, cursor *pagination.Cursor, limit int) ([]Comment, *pagination.Cursor, error)
	DeleteComment(ctx context.Context, publicID, commentID, userID string) (bool, error)
}

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) CreateComment(ctx context.Context, command CreateCommentCommand) (Comment, error) {
	return s.repository.CreateComment(ctx, command.PublicID, command.UserID, command.Body)
}

func (s *Service) ListComments(ctx context.Context, query ListQuery) ([]Comment, *pagination.Cursor, error) {
	return s.repository.ListComments(ctx, query.PublicID, query.Cursor, query.Limit)
}

func (s *Service) DeleteComment(ctx context.Context, command DeleteCommentCommand) error {
	found, err := s.repository.DeleteComment(
		ctx, command.PublicID, command.CommentID, command.UserID,
	)
	if err != nil {
		return err
	}
	if !found {
		return store.ErrNotFound
	}
	return nil
}
