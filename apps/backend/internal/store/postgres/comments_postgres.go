package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"

	"phasma/backend/internal/comments"
	"phasma/backend/internal/database"
	"phasma/backend/internal/pagination"
	"phasma/backend/internal/store"
)

type CommentRepository struct {
	db *database.DB
}

func NewCommentRepository(client *Client) *CommentRepository {
	return &CommentRepository{db: client.db}
}

func (r *CommentRepository) CreateComment(ctx context.Context, postID, userID, body string) (comments.Comment, error) {
	var comment comments.Comment
	var avatar sql.NullString
	err := r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)

		if err := tx.QueryRow(ctx, `INSERT INTO comments (post_id, user_id, body)
			SELECT id, $2, $3 FROM posts WHERE public_id = $1
			RETURNING id, public_id::text, post_id, user_id,
			(SELECT username FROM users WHERE id = $2),
			(SELECT avatar FROM users WHERE id = $2), body, created`,
			postID, userID, body).Scan(&comment.ID, &comment.PublicID, &comment.PostID, &comment.UserID,
			&comment.Username, &avatar, &comment.Body, &comment.Created); err != nil {
			return err
		}

		if _, err := tx.Exec(ctx,
			`UPDATE posts SET comment_count = comment_count + 1 WHERE public_id = $1`, postID); err != nil {
			return err
		}

		var recipientID string
		if err := tx.QueryRow(ctx,
			`SELECT user_id::text FROM posts WHERE public_id = $1`, postID).Scan(&recipientID); err != nil {
			return err
		}

		payload, err := marshalOutboxPayload(activityPayload{
			Op:          "comment",
			CommentID:   comment.PublicID,
			PostID:      postID,
			ActorID:     userID,
			RecipientID: recipientID,
		})
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, "activity", payload); err != nil {
			return err
		}

		return tx.Commit(ctx)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return comments.Comment{}, store.ErrNotFound
	}
	if err != nil {
		return comments.Comment{}, err
	}
	comment.Avatar = database.NullableString(avatar)
	return comment, nil
}

func (r *CommentRepository) ListComments(ctx context.Context, postID string, cursor *pagination.Cursor, limit int) ([]comments.Comment, *pagination.Cursor, error) {
	hasCursor, cursorCreated, cursorID := cursorValues(cursor)
	var result []comments.Comment
	err := r.db.Read(ctx, func() error {
		// The UNION ALL sentinel row fires only when the page is empty. It carries
		// post_exists=true/false so we can distinguish "no comments" from "post gone".
		rows, err := r.db.Pool().Query(ctx, `WITH post AS (SELECT id FROM posts WHERE public_id = $1),
page AS (
    SELECT c.id, c.public_id::text, c.post_id, c.user_id, u.username, u.avatar, c.body, c.created
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.post_id = (SELECT id FROM post)
      AND (NOT $2 OR (c.created, c.id) < ($3, $4))
    ORDER BY c.created DESC, c.id DESC LIMIT $5
)
SELECT id, public_id, post_id, user_id, username, avatar, body, created, true AS post_exists
FROM page
UNION ALL
SELECT NULL::integer, NULL::text, NULL::integer, NULL::integer,
       NULL::text, NULL::text, NULL::text, NULL::timestamptz,
       (SELECT id FROM post) IS NOT NULL
WHERE NOT EXISTS (SELECT 1 FROM page)`,
			postID, hasCursor, cursorCreated, cursorID, limit+1)
		if err != nil {
			return err
		}
		defer rows.Close()
		result = []comments.Comment{}
		for rows.Next() {
			var id, postID, userID *int
			var publicID, username *string
			var avatar sql.NullString
			var body *string
			var created *time.Time
			var postExists bool
			var cr comments.Comment
			if err := rows.Scan(&id, &publicID, &postID, &userID, &username, &avatar, &body, &created, &postExists); err != nil {
				return err
			}
			if id == nil {
				// Sentinel row: page is empty.
				if !postExists {
					return store.ErrNotFound
				}
				return nil
			}
			cr.ID = *id
			cr.PublicID = *publicID
			cr.PostID = *postID
			cr.UserID = *userID
			cr.Username = *username
			cr.Avatar = database.NullableString(avatar)
			cr.Body = *body
			if created != nil {
				cr.Created = *created
			}
			result = append(result, cr)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, nil, err
	}
	if len(result) <= limit {
		return result, nil, nil
	}
	result = result[:limit]
	last := result[len(result)-1]
	return result, &pagination.Cursor{Created: last.Created, ID: last.ID}, nil
}

func (r *CommentRepository) DeleteComment(ctx context.Context, postID, commentID, userID string) (bool, error) {
	var deleted, forbidden bool
	err := r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)

		var deletedPublicID string
		err = tx.QueryRow(ctx, `DELETE FROM comments
			WHERE public_id = $1
			  AND post_id = (SELECT id FROM posts WHERE public_id = $2)
			  AND user_id = $3 RETURNING public_id::text`,
			commentID, postID, userID).Scan(&deletedPublicID)
		if err == nil {
			deleted = true
			if _, err := tx.Exec(ctx,
				`UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0)
				WHERE public_id = $1`, postID); err != nil {
				return err
			}
			payload, err := marshalOutboxPayload(activityPayload{
				Op:        "uncomment",
				CommentID: deletedPublicID,
				ActorID:   userID,
			})
			if err != nil {
				return err
			}
			if _, err := tx.Exec(ctx,
				`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, "activity", payload); err != nil {
				return err
			}
			return tx.Commit(ctx)
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		// Comment exists but isn't owned by this user, or doesn't exist at all.
		if err := tx.QueryRow(ctx, `SELECT EXISTS(
			  SELECT 1 FROM comments
			  WHERE public_id = $1 AND post_id = (SELECT id FROM posts WHERE public_id = $2)
			)`, commentID, postID).Scan(&forbidden); err != nil {
			return err
		}
		return tx.Commit(ctx)
	})
	if err != nil {
		return false, err
	}
	if deleted {
		return true, nil
	}
	if forbidden {
		return true, store.ErrForbidden
	}
	return false, nil
}

var _ comments.Repository = (*CommentRepository)(nil)
