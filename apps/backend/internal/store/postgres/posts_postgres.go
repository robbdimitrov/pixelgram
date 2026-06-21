package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"

	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/pagination"
	"pixelgram/backend/internal/posts"
	"pixelgram/backend/internal/store"
)

const postColumns = `posts.id, posts.public_id, posts.user_id, u.username, u.name, u.avatar,
	posts.filename, posts.description,
	(SELECT count(*) FROM likes WHERE post_id = posts.id) AS likes,
	EXISTS (SELECT 1 FROM likes
	WHERE post_id = posts.id AND likes.user_id = $1) AS liked,
	(SELECT count(*) FROM comments WHERE post_id = posts.id) AS comments,
	posts.created`

type PostRepository struct {
	db *database.DB
}

func NewPostRepository(client *Client) *PostRepository {
	return &PostRepository{db: client.db}
}

func (r *PostRepository) CreatePost(ctx context.Context, userID, filename string, description *string, tags []string) (string, bool, error) {
	var publicID string
	err := r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)
		var consumed string
		if err := tx.QueryRow(ctx, `DELETE FROM uploads WHERE user_id = $1 AND filename = $2
			RETURNING filename`, userID, filename).Scan(&consumed); err != nil {
			return err
		}
		var postID int
		if err := tx.QueryRow(ctx, `INSERT INTO posts (user_id, filename, description)
			VALUES ($1, $2, $3) RETURNING id, public_id`, userID, filename, description).Scan(&postID, &publicID); err != nil {
			return err
		}
		for _, tag := range tags {
			if _, err := tx.Exec(ctx,
				`INSERT INTO hashtags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, tag); err != nil {
				return err
			}
			if _, err := tx.Exec(ctx,
				`INSERT INTO post_hashtags (post_id, hashtag_id)
				SELECT $1, id FROM hashtags WHERE name = $2 ON CONFLICT DO NOTHING`, postID, tag); err != nil {
				return err
			}
			if _, err := tx.Exec(ctx,
				`INSERT INTO search_outbox (entity_type, entity_id) VALUES ('hashtag', $1)`, tag); err != nil {
				return err
			}
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO search_outbox (entity_type, entity_id) VALUES ('post', $1)`, publicID); err != nil {
			return err
		}
		return tx.Commit(ctx)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return publicID, true, nil
}

func (r *PostRepository) GetFeed(ctx context.Context, cursor *pagination.Cursor, limit int, currentUserID string) ([]posts.Post, *pagination.Cursor, error) {
	hasCursor, cursorCreated, cursorID := cursorValues(cursor)
	return r.queryPostPage(ctx, `SELECT `+postColumns+`, posts.created AS cursor_created
		FROM posts JOIN users u ON u.id = posts.user_id
		WHERE (
			posts.user_id = $1
			OR EXISTS (
				SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = posts.user_id
			)
			OR NOT EXISTS (SELECT 1 FROM follows WHERE follower_id = $1)
		)
		AND (NOT $2 OR (posts.created, posts.id) < ($3, $4))
		ORDER BY posts.created DESC, posts.id DESC LIMIT $5`,
		limit, currentUserID, hasCursor, cursorCreated, cursorID, limit+1)
}

func (r *PostRepository) GetPosts(ctx context.Context, username string, cursor *pagination.Cursor, limit int, currentUserID string) ([]posts.Post, *pagination.Cursor, error) {
	exists, err := usernameExists(ctx, r.db, username)
	if err != nil {
		return nil, nil, err
	}
	if !exists {
		return nil, nil, store.ErrNotFound
	}
	hasCursor, cursorCreated, cursorID := cursorValues(cursor)
	return r.queryPostPage(ctx, `SELECT `+postColumns+`, posts.created AS cursor_created
		FROM posts JOIN users u ON u.id = posts.user_id
		WHERE u.username = $2
		AND (NOT $3 OR (posts.created, posts.id) < ($4, $5))
		ORDER BY posts.created DESC, posts.id DESC LIMIT $6`,
		limit, currentUserID, username, hasCursor, cursorCreated, cursorID, limit+1)
}

func (r *PostRepository) GetLikedPosts(ctx context.Context, username string, cursor *pagination.Cursor, limit int, currentUserID string) ([]posts.Post, *pagination.Cursor, error) {
	exists, err := usernameExists(ctx, r.db, username)
	if err != nil {
		return nil, nil, err
	}
	if !exists {
		return nil, nil, store.ErrNotFound
	}
	hasCursor, cursorCreated, cursorID := cursorValues(cursor)
	return r.queryPostPage(ctx, `SELECT `+postColumns+`, likes.created AS cursor_created
		FROM posts JOIN users u ON u.id = posts.user_id
		INNER JOIN likes ON likes.post_id = posts.id
		WHERE likes.user_id = (SELECT id FROM users WHERE username = $2)
		AND (NOT $3 OR (likes.created, posts.id) < ($4, $5))
		ORDER BY likes.created DESC, posts.id DESC LIMIT $6`,
		limit, currentUserID, username, hasCursor, cursorCreated, cursorID, limit+1)
}

func (r *PostRepository) GetPost(ctx context.Context, postID, currentUserID string) (posts.Post, bool, error) {
	result, err := r.queryPosts(ctx, `SELECT `+postColumns+`
		FROM posts JOIN users u ON u.id = posts.user_id
		WHERE posts.public_id = $2`, currentUserID, postID)
	if err != nil {
		return posts.Post{}, false, err
	}
	if len(result) == 0 {
		return posts.Post{}, false, nil
	}
	return result[0], true, nil
}

func (r *PostRepository) DeletePost(ctx context.Context, postID, userID string) (string, bool, error) {
	var filename string
	err := r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)
		if err := tx.QueryRow(ctx, `DELETE FROM posts WHERE public_id = $1 AND user_id = $2
			RETURNING filename`, postID, userID).Scan(&filename); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `UPDATE users SET avatar = $1 WHERE avatar = $2`, "", filename); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO search_outbox (entity_type, entity_id) VALUES ('post', $1)`, postID); err != nil {
			return err
		}
		return tx.Commit(ctx)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return filename, true, nil
}

func (r *PostRepository) PostExists(ctx context.Context, postID string) (bool, error) {
	var exists bool
	err := r.db.Read(ctx, func() error {
		return r.db.Pool().QueryRow(ctx,
			`SELECT EXISTS (SELECT 1 FROM posts WHERE public_id = $1)`, postID).Scan(&exists)
	})
	return exists, err
}

func (r *PostRepository) LikePost(ctx context.Context, postID, userID string) error {
	return r.exec(ctx, `INSERT INTO likes (user_id, post_id)
		SELECT $1, id FROM posts WHERE public_id = $2 ON CONFLICT DO NOTHING`, userID, postID)
}

func (r *PostRepository) UnlikePost(ctx context.Context, postID, userID string) error {
	return r.exec(ctx, `DELETE FROM likes
		WHERE user_id = $1 AND post_id = (SELECT id FROM posts WHERE public_id = $2)`,
		userID, postID)
}

func (r *PostRepository) exec(ctx context.Context, query string, args ...any) error {
	return r.db.Write(ctx, func() error {
		_, err := r.db.Pool().Exec(ctx, query, args...)
		return err
	})
}

func (r *PostRepository) queryPosts(ctx context.Context, query string, args ...any) ([]posts.Post, error) {
	var result []posts.Post
	err := r.db.Read(ctx, func() error {
		rows, err := r.db.Pool().Query(ctx, query, args...)
		if err != nil {
			return err
		}
		defer rows.Close()
		result = []posts.Post{}
		for rows.Next() {
			var post posts.Post
			var description, avatar sql.NullString
			if err := rows.Scan(&post.ID, &post.PublicID, &post.UserID, &post.Username,
				&post.Name, &avatar, &post.Filename, &description, &post.Likes,
				&post.Liked, &post.Comments, &post.Created); err != nil {
				return err
			}
			post.Avatar = database.NullableString(avatar)
			post.Description = database.NullableString(description)
			result = append(result, post)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (r *PostRepository) queryPostPage(ctx context.Context, query string, limit int, args ...any) ([]posts.Post, *pagination.Cursor, error) {
	type row struct {
		post          posts.Post
		cursorCreated time.Time
	}
	var result []row
	err := r.db.Read(ctx, func() error {
		rows, err := r.db.Pool().Query(ctx, query, args...)
		if err != nil {
			return err
		}
		defer rows.Close()
		result = []row{}
		for rows.Next() {
			var item row
			var description, avatar sql.NullString
			if err := rows.Scan(&item.post.ID, &item.post.PublicID, &item.post.UserID,
				&item.post.Username, &item.post.Name, &avatar, &item.post.Filename,
				&description, &item.post.Likes, &item.post.Liked, &item.post.Comments,
				&item.post.Created, &item.cursorCreated); err != nil {
				return err
			}
			item.post.Avatar = database.NullableString(avatar)
			item.post.Description = database.NullableString(description)
			result = append(result, item)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, nil, err
	}
	hasMore := len(result) > limit
	if hasMore {
		result = result[:limit]
	}
	items := make([]posts.Post, len(result))
	for i, item := range result {
		items[i] = item.post
	}
	if !hasMore {
		return items, nil, nil
	}
	last := result[len(result)-1]
	return items, &pagination.Cursor{Created: last.cursorCreated, ID: last.post.ID}, nil
}

func cursorValues(cursor *pagination.Cursor) (bool, time.Time, int) {
	if cursor == nil {
		return false, time.Time{}, 0
	}
	return true, cursor.Created, cursor.ID
}

var _ posts.Repository = (*PostRepository)(nil)
