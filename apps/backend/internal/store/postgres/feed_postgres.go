package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"phasma/backend/internal/database"
	"phasma/backend/internal/feed"
	"phasma/backend/internal/pagination"
	"phasma/backend/internal/posts"
)

type FeedRepository struct {
	db             *database.DB
	celebThreshold int64
}

func NewFeedRepository(client *Client, threshold int64) *FeedRepository {
	return &FeedRepository{db: client.db, celebThreshold: threshold}
}

func (r *FeedRepository) ListFeed(ctx context.Context, userID string, cursor *pagination.Cursor, limit int) ([]posts.Post, *pagination.Cursor, error) {
	hasCursor, cursorCreated, cursorID := cursorValues(cursor)
	return r.queryFeedPage(ctx, `SELECT `+postColumns+`, posts.created AS cursor_created
		FROM feed f
		JOIN posts ON posts.id = f.post_id
		JOIN users u ON u.id = posts.user_id
		WHERE f.user_id = $1
		  AND (NOT $2 OR (posts.created, posts.id) < ($3, $4))

		UNION ALL

		SELECT `+postColumns+`, posts.created AS cursor_created
		FROM posts
		JOIN users u ON u.id = posts.user_id
		WHERE posts.user_id IN (
		  SELECT fl.followee_id
		  FROM follows fl
		  JOIN users cu ON cu.id = fl.followee_id
		  WHERE fl.follower_id = $1
		    AND cu.follower_count > $6
		)
		AND NOT EXISTS (
		  SELECT 1 FROM feed WHERE feed.user_id = $1 AND feed.post_id = posts.id
		)
		AND (NOT $2 OR (posts.created, posts.id) < ($3, $4))

		ORDER BY cursor_created DESC, id DESC LIMIT $5`,
		limit, userID, hasCursor, cursorCreated, cursorID, limit+1, r.celebThreshold)
}

// insertEntriesBatchSize keeps bind parameters well under Postgres's 65,535 limit (3 per row).
const insertEntriesBatchSize = 5000

func (r *FeedRepository) InsertEntries(ctx context.Context, entries []feed.Entry) error {
	if len(entries) == 0 {
		return nil
	}
	return r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)
		for i := 0; i < len(entries); i += insertEntriesBatchSize {
			end := i + insertEntriesBatchSize
			if end > len(entries) {
				end = len(entries)
			}
			batch := entries[i:end]
			args := make([]any, 0, len(batch)*3)
			placeholders := make([]string, len(batch))
			for j, e := range batch {
				base := j * 3
				args = append(args, e.UserID, e.PostID, e.Created)
				placeholders[j] = fmt.Sprintf("($%d, $%d, $%d)", base+1, base+2, base+3)
			}
			query := `INSERT INTO feed (user_id, post_id, created) VALUES ` +
				strings.Join(placeholders, ", ") +
				` ON CONFLICT (user_id, post_id) DO NOTHING`
			if _, err := tx.Exec(ctx, query, args...); err != nil {
				return err
			}
		}
		return tx.Commit(ctx)
	})
}

func (r *FeedRepository) PruneByFollowee(ctx context.Context, followerID int64, followeeID int64) error {
	return r.db.Write(ctx, func() error {
		_, err := r.db.Pool().Exec(ctx,
			`DELETE FROM feed f USING posts p
			WHERE f.post_id = p.id AND f.user_id = $1 AND p.user_id = $2`,
			followerID, followeeID)
		return err
	})
}

func (r *FeedRepository) GetFollowers(ctx context.Context, userID int64) ([]int64, error) {
	var followers []int64
	err := r.db.Read(ctx, func() error {
		rows, err := r.db.Pool().Query(ctx,
			`SELECT follower_id FROM follows WHERE followee_id = $1 LIMIT $2`, userID, r.celebThreshold)
		if err != nil {
			return err
		}
		defer rows.Close()
		followers = []int64{}
		for rows.Next() {
			var id int64
			if err := rows.Scan(&id); err != nil {
				return err
			}
			followers = append(followers, id)
		}
		return rows.Err()
	})
	return followers, err
}

func (r *FeedRepository) GetRecentPostEntries(ctx context.Context, userID int64, limit int) ([]feed.Entry, error) {
	var entries []feed.Entry
	err := r.db.Read(ctx, func() error {
		rows, err := r.db.Pool().Query(ctx,
			`SELECT id, created FROM posts WHERE user_id = $1 ORDER BY created DESC LIMIT $2`,
			userID, limit)
		if err != nil {
			return err
		}
		defer rows.Close()
		entries = []feed.Entry{}
		for rows.Next() {
			var e feed.Entry
			if err := rows.Scan(&e.PostID, &e.Created); err != nil {
				return err
			}
			entries = append(entries, e)
		}
		return rows.Err()
	})
	return entries, err
}

func (r *FeedRepository) GetUserFollowerCount(ctx context.Context, userID int64) (int64, error) {
	var count int64
	err := r.db.Read(ctx, func() error {
		return r.db.Pool().QueryRow(ctx,
			`SELECT follower_count FROM users WHERE id = $1`, userID).Scan(&count)
	})
	return count, err
}

func (r *FeedRepository) queryFeedPage(ctx context.Context, query string, limit int, args ...any) ([]posts.Post, *pagination.Cursor, error) {
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

var _ feed.Repository = (*FeedRepository)(nil)
