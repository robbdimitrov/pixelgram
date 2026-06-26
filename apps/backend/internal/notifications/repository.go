package notifications

import (
	"context"

	"phasma/backend/internal/pagination"
)

type Repository interface {
	ListNotifications(ctx context.Context, userID int64, cursor *pagination.Cursor, limit int) ([]Notification, error)
	MarkRead(ctx context.Context, publicID string, userID int64) error
	UnreadCount(ctx context.Context, userID int64) (int, error)
	DeleteByEntity(ctx context.Context, entityType string, entityID string) error
	DeleteByActorAndType(ctx context.Context, actorID int64, recipientID int64, notifType string, entityID string) error
	CreateNotification(ctx context.Context, n Notification) error
}
