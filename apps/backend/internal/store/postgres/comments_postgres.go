package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jackc/pgx/v5"

	"pixelgram/backend/internal/comments"
	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/pagination"
	"pixelgram/backend/internal/store"
)

type CommentRepository struct {
	db *database.DB
}

func NewCommentRepository(client *Client) *CommentRepository {
	return &CommentRepository{db: client.db}
}

func (r *CommentRepository) PostExists(ctx context.Context, postID string) (bool, error) {
	var exists bool
	err := r.db.Read(ctx, func() error {
		return r.db.Pool().QueryRow(ctx,
			`SELECT EXISTS (SELECT 1 FROM posts WHERE public_id = $1)`, postID).Scan(&exists)
	})
	return exists, err
}

func (r *CommentRepository) CreateComment(ctx context.Context, postID, userID, body string) (comments.Comment, error) {
	var comment comments.Comment
	var avatar sql.NullString
	err := r.db.Write(ctx, func() error {
		return r.db.Pool().QueryRow(ctx, `INSERT INTO comments (post_id, user_id, body)
			SELECT id, $2, $3 FROM posts WHERE public_id = $1
			RETURNING id, post_id, user_id,
			(SELECT username FROM users WHERE id = $2),
			(SELECT avatar FROM users WHERE id = $2), body, created`,
			postID, userID, body).Scan(&comment.ID, &comment.PostID, &comment.UserID,
			&comment.Username, &avatar, &comment.Body, &comment.Created)
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
		rows, err := r.db.Pool().Query(ctx, `SELECT c.id, c.post_id, c.user_id,
			u.username, u.avatar, c.body, c.created
			FROM comments c JOIN users u ON u.id = c.user_id
			WHERE c.post_id = (SELECT id FROM posts WHERE public_id = $1)
			AND (NOT $2 OR (c.created, c.id) < ($3, $4))
			ORDER BY c.created DESC, c.id DESC LIMIT $5`,
			postID, hasCursor, cursorCreated, cursorID, limit+1)
		if err != nil {
			return err
		}
		defer rows.Close()
		result = []comments.Comment{}
		for rows.Next() {
			var comment comments.Comment
			var avatar sql.NullString
			if err := rows.Scan(&comment.ID, &comment.PostID, &comment.UserID,
				&comment.Username, &avatar, &comment.Body, &comment.Created); err != nil {
				return err
			}
			comment.Avatar = database.NullableString(avatar)
			result = append(result, comment)
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
		var deletedID int
		err := r.db.Pool().QueryRow(ctx, `DELETE FROM comments
			WHERE id = $1
			  AND post_id = (SELECT id FROM posts WHERE public_id = $2)
			  AND user_id = $3 RETURNING id`,
			commentID, postID, userID).Scan(&deletedID)
		if err == nil {
			deleted = true
			return nil
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		// Comment exists but isn't owned by this user, or doesn't exist at all.
		return r.db.Pool().QueryRow(ctx, `SELECT EXISTS(
			  SELECT 1 FROM comments
			  WHERE id = $1 AND post_id = (SELECT id FROM posts WHERE public_id = $2)
			)`, commentID, postID).Scan(&forbidden)
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
