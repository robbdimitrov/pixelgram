package notifications

import (
	"context"

	"phasma/backend/internal/pagination"
)

type ListQuery struct {
	UserID int64
	Cursor *pagination.Cursor
	Limit  int
}

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) ListNotifications(ctx context.Context, query ListQuery) ([]Notification, *pagination.Cursor, error) {
	items, err := s.repository.ListNotifications(ctx, query.UserID, query.Cursor, query.Limit+1)
	if err != nil {
		return nil, nil, err
	}
	hasMore := len(items) > query.Limit
	if hasMore {
		items = items[:query.Limit]
	}
	if !hasMore || len(items) == 0 {
		return items, nil, nil
	}
	last := items[len(items)-1]
	nextCursor := &pagination.Cursor{Created: last.Created, ID: int(last.ID)}
	return items, nextCursor, nil
}

func (s *Service) MarkRead(ctx context.Context, id int64, userID int64) error {
	return s.repository.MarkRead(ctx, id, userID)
}

func (s *Service) UnreadCount(ctx context.Context, userID int64) (int, error) {
	return s.repository.UnreadCount(ctx, userID)
}
