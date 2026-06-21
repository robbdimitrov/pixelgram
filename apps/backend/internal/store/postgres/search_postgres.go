package postgres

import (
	"context"
	"database/sql"

	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/search"
)

type SearchRepository struct {
	db *database.DB
}

func NewSearchRepository(client *Client) *SearchRepository {
	return &SearchRepository{db: client.db}
}

func (r *SearchRepository) SearchUsers(ctx context.Context, q string) ([]search.UserResult, error) {
	var results []search.UserResult
	err := r.db.Read(ctx, func() error {
		rows, err := r.db.Pool().Query(ctx,
			`SELECT username, avatar FROM users
			WHERE username % $1
			ORDER BY similarity(username, $1) DESC, username
			LIMIT 8`, q)
		if err != nil {
			return err
		}
		defer rows.Close()
		results = []search.UserResult{}
		for rows.Next() {
			var u search.UserResult
			var avatar sql.NullString
			if err := rows.Scan(&u.Username, &avatar); err != nil {
				return err
			}
			u.Avatar = database.NullableString(avatar)
			results = append(results, u)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return results, nil
}

func (r *SearchRepository) SearchHashtags(ctx context.Context, q string) ([]search.HashtagResult, error) {
	var results []search.HashtagResult
	err := r.db.Read(ctx, func() error {
		rows, err := r.db.Pool().Query(ctx,
			`SELECT h.name, (
			  SELECT COUNT(*) FROM post_hashtags ph WHERE ph.hashtag_id = h.id
			) AS post_count
			FROM hashtags h
			WHERE h.name % $1
			ORDER BY similarity(h.name, $1) DESC, h.name
			LIMIT 8`, q)
		if err != nil {
			return err
		}
		defer rows.Close()
		results = []search.HashtagResult{}
		for rows.Next() {
			var h search.HashtagResult
			if err := rows.Scan(&h.Name, &h.PostCount); err != nil {
				return err
			}
			results = append(results, h)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return results, nil
}

var _ search.Repository = (*SearchRepository)(nil)
