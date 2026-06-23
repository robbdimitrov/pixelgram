package postgres

import (
	"context"
	"time"

	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/notifications"
	"pixelgram/backend/internal/pagination"
)

type NotificationRepository struct {
	db *database.DB
}

func NewNotificationRepository(client *Client) *NotificationRepository {
	return &NotificationRepository{db: client.db}
}

func (r *NotificationRepository) ListNotifications(ctx context.Context, userID int64, cursor *pagination.Cursor, limit int) ([]notifications.Notification, error) {
	hasCursor, cursorCreated, cursorID := false, time.Time{}, int64(0)
	if cursor != nil {
		hasCursor = true
		cursorCreated = cursor.Created
		cursorID = int64(cursor.ID)
	}

	var result []notifications.Notification
	err := r.db.Read(ctx, func() error {
		rows, err := r.db.Pool().Query(ctx, `SELECT id, external_id, user_id, actor_id, type, entity_id, read, created
			FROM notifications
			WHERE user_id = $1
			AND (NOT $2 OR (created, id) < ($3, $4))
			ORDER BY created DESC, id DESC LIMIT $5`,
			userID, hasCursor, cursorCreated, cursorID, limit)
		if err != nil {
			return err
		}
		defer rows.Close()
		result = []notifications.Notification{}
		for rows.Next() {
			var n notifications.Notification
			if err := rows.Scan(&n.ID, &n.ExternalID, &n.UserID, &n.ActorID,
				&n.Type, &n.EntityID, &n.Read, &n.Created); err != nil {
				return err
			}
			result = append(result, n)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (r *NotificationRepository) MarkRead(ctx context.Context, id int64, userID int64) error {
	return r.db.Write(ctx, func() error {
		_, err := r.db.Pool().Exec(ctx,
			`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`, id, userID)
		return err
	})
}

func (r *NotificationRepository) UnreadCount(ctx context.Context, userID int64) (int, error) {
	var count int
	err := r.db.Read(ctx, func() error {
		return r.db.Pool().QueryRow(ctx,
			`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false`, userID).Scan(&count)
	})
	return count, err
}

func (r *NotificationRepository) DeleteByEntity(ctx context.Context, entityType string, entityID string) error {
	return r.db.Write(ctx, func() error {
		var err error
		if entityType == "post" {
			// Like notifications store post_id as entity_id; delete all for this post.
			_, err = r.db.Pool().Exec(ctx,
				`DELETE FROM notifications WHERE type = 'like' AND entity_id = $1`, entityID)
		} else {
			_, err = r.db.Pool().Exec(ctx,
				`DELETE FROM notifications WHERE type = $1 AND entity_id = $2`, entityType, entityID)
		}
		return err
	})
}

func (r *NotificationRepository) DeleteByActorAndType(ctx context.Context, actorID int64, recipientID int64, notifType string, entityID string) error {
	return r.db.Write(ctx, func() error {
		_, err := r.db.Pool().Exec(ctx,
			`DELETE FROM notifications WHERE actor_id = $1 AND user_id = $2 AND type = $3 AND entity_id = $4`,
			actorID, recipientID, notifType, entityID)
		return err
	})
}

func (r *NotificationRepository) CreateNotification(ctx context.Context, n notifications.Notification) error {
	return r.db.Write(ctx, func() error {
		_, err := r.db.Pool().Exec(ctx,
			`INSERT INTO notifications (external_id, user_id, actor_id, type, entity_id)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (external_id) DO NOTHING`,
			n.ExternalID, n.UserID, n.ActorID, n.Type, n.EntityID)
		return err
	})
}

var _ notifications.Repository = (*NotificationRepository)(nil)
