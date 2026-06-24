package feed

import (
	"context"

	"phasma/backend/internal/pagination"
	"phasma/backend/internal/posts"
)

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) ListFeed(ctx context.Context, userID string, cursor *pagination.Cursor, limit int) ([]posts.Post, *pagination.Cursor, error) {
	return s.repository.ListFeed(ctx, userID, cursor, limit)
}
