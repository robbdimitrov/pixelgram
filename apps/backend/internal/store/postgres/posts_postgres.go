package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"

	"phasma/backend/internal/database"
	"phasma/backend/internal/pagination"
	"phasma/backend/internal/posts"
	"phasma/backend/internal/store"
)

const postColumns = `posts.id, posts.public_id, posts.user_id, u.username, u.name, u.avatar,
	posts.filename, posts.description,
	posts.like_count AS likes,
	EXISTS (SELECT 1 FROM likes
	WHERE post_id = posts.id AND likes.user_id = $1) AS liked,
	posts.comment_count AS comments,
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
		var createdAt time.Time
		if err := tx.QueryRow(ctx, `INSERT INTO posts (user_id, filename, description)
			VALUES ($1, $2, $3) RETURNING id, public_id, created`, userID, filename, description).Scan(&postID, &publicID, &createdAt); err != nil {
			return err
		}
		var username string
		var followerCount int64
		if err := tx.QueryRow(ctx,
			`UPDATE users SET post_count = post_count + 1
			WHERE id = $1 RETURNING username, follower_count`,
			userID).Scan(&username, &followerCount); err != nil {
			return err // hard fail — wrong count means wrong fan-out decision
		}

		descStr := ""
		if description != nil {
			descStr = *description
		}

		hashtags := tags
		if hashtags == nil {
			hashtags = []string{}
		}

		postPayload, err := marshalOutboxPayload(entityPostUpsertPayload{
			Table:         "posts",
			Op:            "upsert",
			ID:            int64(postID),
			PostID:        publicID,
			AuthorID:      userID,
			Description:   descStr,
			Username:      username,
			Hashtags:      hashtags,
			Created:       createdAt.UTC().Format(time.RFC3339Nano),
			FollowerCount: followerCount,
		})
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, "entity-changes", postPayload); err != nil {
			return err
		}

		for _, tag := range tags {
			var postCount int
			if err := tx.QueryRow(ctx,
				`INSERT INTO hashtags (name) VALUES ($1)
				ON CONFLICT (name) DO UPDATE SET post_count = hashtags.post_count + 1
				RETURNING post_count`, tag).Scan(&postCount); err != nil {
				return err
			}
			if _, err := tx.Exec(ctx,
				`INSERT INTO post_hashtags (post_id, hashtag_id)
				SELECT $1, id FROM hashtags WHERE name = $2 ON CONFLICT DO NOTHING`, postID, tag); err != nil {
				return err
			}
			hashtagPayload, err := marshalOutboxPayload(entityHashtagUpsertPayload{
				Table:     "hashtags",
				Op:        "upsert",
				Name:      tag,
				PostCount: postCount,
			})
			if err != nil {
				return err
			}
			if _, err := tx.Exec(ctx,
				`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, "entity-changes", hashtagPayload); err != nil {
				return err
			}
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

func (r *PostRepository) DeletePost(ctx context.Context, postID, userID string) (string, error) {
	var filename string
	err := r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)

		// Lock the row to prevent concurrent deletes from racing on ownership.
		var postDBID int
		var ownerID string
		if err := tx.QueryRow(ctx,
			`SELECT id, user_id::text FROM posts WHERE public_id = $1 FOR UPDATE`,
			postID).Scan(&postDBID, &ownerID); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return store.ErrNotFound
			}
			return err
		}
		if ownerID != userID {
			return store.ErrForbidden
		}

		// Look up hashtag names before deleting.
		hashtagRows, err := tx.Query(ctx,
			`SELECT h.name FROM hashtags h
			JOIN post_hashtags ph ON ph.hashtag_id = h.id
			WHERE ph.post_id = $1`, postDBID)
		if err != nil {
			return err
		}
		var hashtags []string
		for hashtagRows.Next() {
			var name string
			if err := hashtagRows.Scan(&name); err != nil {
				hashtagRows.Close()
				return err
			}
			hashtags = append(hashtags, name)
		}
		hashtagRows.Close()
		if err := hashtagRows.Err(); err != nil {
			return err
		}

		// Collect comment public IDs before deletion for notification cleanup.
		commentRows, err := tx.Query(ctx, `SELECT public_id::text FROM comments WHERE post_id = $1`, postDBID)
		if err != nil {
			return err
		}
		commentPublicIDs := []string{}
		for commentRows.Next() {
			var cid string
			if err := commentRows.Scan(&cid); err != nil {
				commentRows.Close()
				return err
			}
			commentPublicIDs = append(commentPublicIDs, cid)
		}
		commentRows.Close()
		if err := commentRows.Err(); err != nil {
			return err
		}

		if err := tx.QueryRow(ctx, `DELETE FROM posts WHERE id = $1 RETURNING filename`,
			postDBID).Scan(&filename); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `UPDATE users SET avatar = $1 WHERE avatar = $2`, "", filename); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx,
			`UPDATE users SET post_count = GREATEST(post_count - 1, 0) WHERE id = $1`, userID); err != nil {
			return err
		}

		postPayload, err := marshalOutboxPayload(entityPostDeletePayload{
			Table:            "posts",
			Op:               "delete",
			ID:               int64(postDBID),
			PostID:           postID,
			AuthorID:         userID,
			Filename:         filename,
			CommentPublicIDs: commentPublicIDs,
		})
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, "entity-changes", postPayload); err != nil {
			return err
		}

		for _, tag := range hashtags {
			var postCount int
			if err := tx.QueryRow(ctx,
				`UPDATE hashtags SET post_count = GREATEST(post_count - 1, 0)
				WHERE name = $1 RETURNING post_count`, tag).Scan(&postCount); err != nil {
				return err
			}
			hashtagPayload, err := marshalOutboxPayload(entityHashtagUpsertPayload{
				Table:     "hashtags",
				Op:        "upsert",
				Name:      tag,
				PostCount: postCount,
			})
			if err != nil {
				return err
			}
			if _, err := tx.Exec(ctx,
				`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, "entity-changes", hashtagPayload); err != nil {
				return err
			}
		}

		return tx.Commit(ctx)
	})
	return filename, err
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
	err := r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)

		likeTag, err := tx.Exec(ctx, `INSERT INTO likes (user_id, post_id)
			SELECT $1, id FROM posts WHERE public_id = $2 ON CONFLICT DO NOTHING`, userID, postID)
		if err != nil {
			return err
		}
		if likeTag.RowsAffected() == 0 {
			// Distinguish "post gone" from "already liked" atomically.
			var exists bool
			if err := tx.QueryRow(ctx,
				`SELECT EXISTS (SELECT 1 FROM posts WHERE public_id = $1)`, postID).Scan(&exists); err != nil {
				return err
			}
			if !exists {
				return store.ErrNotFound
			}
			return tx.Commit(ctx)
		}

		if _, err := tx.Exec(ctx,
			`UPDATE posts SET like_count = like_count + 1 WHERE public_id = $1`, postID); err != nil {
			return err
		}

		var recipientID string
		if err := tx.QueryRow(ctx,
			`SELECT user_id::text FROM posts WHERE public_id = $1`, postID).Scan(&recipientID); err != nil {
			return err
		}

		payload, err := marshalOutboxPayload(activityPayload{
			Op:          "like",
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
		return store.ErrNotFound
	}
	return err
}

func (r *PostRepository) UnlikePost(ctx context.Context, postID, userID string) error {
	err := r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)

		unlikeTag, err := tx.Exec(ctx, `DELETE FROM likes
			WHERE user_id = $1 AND post_id = (SELECT id FROM posts WHERE public_id = $2)`,
			userID, postID)
		if err != nil {
			return err
		}
		if unlikeTag.RowsAffected() == 0 {
			// Distinguish "post gone" from "not liked" atomically.
			var exists bool
			if err := tx.QueryRow(ctx,
				`SELECT EXISTS (SELECT 1 FROM posts WHERE public_id = $1)`, postID).Scan(&exists); err != nil {
				return err
			}
			if !exists {
				return store.ErrNotFound
			}
			return tx.Commit(ctx)
		}

		if _, err := tx.Exec(ctx,
			`UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE public_id = $1`, postID); err != nil {
			return err
		}

		var recipientID string
		if err := tx.QueryRow(ctx,
			`SELECT user_id::text FROM posts WHERE public_id = $1`, postID).Scan(&recipientID); err != nil {
			return err
		}

		payload, err := marshalOutboxPayload(activityPayload{
			Op:          "unlike",
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
		return store.ErrNotFound
	}
	return err
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

func (r *PostRepository) ListPopularPosts(ctx context.Context, viewerID string, limit int) ([]posts.Post, error) {
	return r.queryPosts(ctx, `SELECT `+postColumns+`
        FROM posts
        JOIN users u ON u.id = posts.user_id
        WHERE posts.created > NOW() - INTERVAL '7 days'
          AND EXISTS (SELECT 1 FROM likes WHERE post_id = posts.id)
        ORDER BY likes DESC,
                 posts.created DESC
        LIMIT $2`, viewerID, limit)
}

var _ posts.Repository = (*PostRepository)(nil)
