package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"

	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/pagination"
	"pixelgram/backend/internal/store"
	"pixelgram/backend/internal/users"
)

const userColumns = `u.id, u.name, u.username, u.email, u.avatar, u.bio,
	(SELECT count(*) FROM posts WHERE user_id = u.id) AS posts,
	(SELECT count(*) FROM likes WHERE user_id = u.id) AS likes,
	(SELECT count(*) FROM follows WHERE followee_id = u.id) AS followers,
	(SELECT count(*) FROM follows WHERE follower_id = u.id) AS following,
	EXISTS (SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = u.id) AS is_following,
	u.created`

type UserRepository struct {
	db *database.DB
}

func NewUserRepository(client *Client) *UserRepository {
	return &UserRepository{db: client.db}
}

func (r *UserRepository) CreateUser(ctx context.Context, name, username, email, passwordHash string) (int, error) {
	var id int
	err := r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)
		if err := tx.QueryRow(ctx, `INSERT INTO users (name, username, email, password)
			VALUES ($1, $2, $3, $4) RETURNING id`, name, username, email, passwordHash).Scan(&id); err != nil {
			return err
		}
		payload := fmt.Sprintf(
			`{"table":"users","op":"upsert","id":%d,"user_id":"%d","username":%q,"bio":""}`,
			id, id, username,
		)
		if _, err := tx.Exec(ctx,
			`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, "entity-changes", payload); err != nil {
			return err
		}
		return tx.Commit(ctx)
	})
	if err != nil {
		if database.UniqueViolation(err) {
			return 0, store.ErrConflict
		}
		return 0, err
	}
	return id, nil
}

func (r *UserRepository) GetUserWithID(ctx context.Context, userID string) (users.UserCredentials, bool, error) {
	var user users.UserCredentials
	err := r.db.Read(ctx, func() error {
		return r.db.Pool().QueryRow(ctx, `SELECT id, password FROM users WHERE id = $1`, userID).
			Scan(&user.ID, &user.PasswordHash)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return users.UserCredentials{}, false, nil
	}
	if err != nil {
		return users.UserCredentials{}, false, err
	}
	return user, true, nil
}

func (r *UserRepository) GetUserByUsername(ctx context.Context, username, currentUserID string) (users.User, bool, error) {
	return r.getUser(ctx, "username", username, currentUserID)
}

func (r *UserRepository) GetUserByID(ctx context.Context, userID, currentUserID string) (users.User, bool, error) {
	return r.getUser(ctx, "id", userID, currentUserID)
}

func (r *UserRepository) ListFollowers(ctx context.Context, username string, cursor *pagination.Cursor, limit int, currentUserID string) ([]users.User, *pagination.Cursor, error) {
	exists, err := usernameExists(ctx, r.db, username)
	if err != nil {
		return nil, nil, err
	}
	if !exists {
		return nil, nil, store.ErrNotFound
	}
	hasCursor, cursorCreated, cursorID := cursorValues(cursor)
	return r.queryUserPage(ctx, `SELECT `+userColumns+`, f.created AS cursor_created
		FROM follows f
		JOIN users target ON target.id = f.followee_id
		JOIN users u ON u.id = f.follower_id
		WHERE target.username = $2
		AND (NOT $3 OR (f.created, u.id) < ($4, $5))
		ORDER BY f.created DESC, u.id DESC LIMIT $6`,
		limit, currentUserID, username, hasCursor, cursorCreated, cursorID, limit+1)
}

func (r *UserRepository) ListFollowing(ctx context.Context, username string, cursor *pagination.Cursor, limit int, currentUserID string) ([]users.User, *pagination.Cursor, error) {
	exists, err := usernameExists(ctx, r.db, username)
	if err != nil {
		return nil, nil, err
	}
	if !exists {
		return nil, nil, store.ErrNotFound
	}
	hasCursor, cursorCreated, cursorID := cursorValues(cursor)
	return r.queryUserPage(ctx, `SELECT `+userColumns+`, f.created AS cursor_created
		FROM follows f
		JOIN users target ON target.id = f.follower_id
		JOIN users u ON u.id = f.followee_id
		WHERE target.username = $2
		AND (NOT $3 OR (f.created, u.id) < ($4, $5))
		ORDER BY f.created DESC, u.id DESC LIMIT $6`,
		limit, currentUserID, username, hasCursor, cursorCreated, cursorID, limit+1)
}

func (r *UserRepository) getUser(ctx context.Context, column, value, currentUserID string) (users.User, bool, error) {
	var user users.User
	var avatar, bio sql.NullString
	// column is an internal constant ("id" or "username"), never user input,
	// so interpolating it here is safe; values stay parameterized.
	err := r.db.Read(ctx, func() error {
		return r.db.Pool().QueryRow(ctx, `SELECT `+userColumns+`
			FROM users u WHERE u.`+column+` = $2`, currentUserID, value).Scan(
			&user.ID, &user.Name, &user.Username, &user.Email, &avatar, &bio,
			&user.Posts, &user.Likes, &user.Followers, &user.Following,
			&user.IsFollowing, &user.Created,
		)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return users.User{}, false, nil
	}
	if err != nil {
		return users.User{}, false, err
	}
	user.Avatar = database.NullableString(avatar)
	user.Bio = database.NullableString(bio)
	return user, true, nil
}

func (r *UserRepository) queryUserPage(ctx context.Context, query string, limit int, args ...any) ([]users.User, *pagination.Cursor, error) {
	type row struct {
		user          users.User
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
			var avatar, bio sql.NullString
			if err := rows.Scan(&item.user.ID, &item.user.Name, &item.user.Username,
				&item.user.Email, &avatar, &bio, &item.user.Posts, &item.user.Likes,
				&item.user.Followers, &item.user.Following, &item.user.IsFollowing,
				&item.user.Created, &item.cursorCreated); err != nil {
				return err
			}
			item.user.Avatar = database.NullableString(avatar)
			item.user.Bio = database.NullableString(bio)
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
	items := make([]users.User, len(result))
	for i, item := range result {
		items[i] = item.user
	}
	if !hasMore {
		return items, nil, nil
	}
	last := result[len(result)-1]
	return items, &pagination.Cursor{Created: last.cursorCreated, ID: last.user.ID}, nil
}

func (r *UserRepository) FollowUser(ctx context.Context, followerID, followeeID string) error {
	var targetExists bool
	err := r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)
		var followInserted bool
		if err := tx.QueryRow(ctx, `WITH target AS (
				SELECT id FROM users WHERE id = $2
			), inserted AS (
				INSERT INTO follows (follower_id, followee_id)
				SELECT $1, id FROM target ON CONFLICT DO NOTHING
				RETURNING 1
			)
			SELECT EXISTS (SELECT 1 FROM target), EXISTS (SELECT 1 FROM inserted)`,
			followerID, followeeID).Scan(&targetExists, &followInserted); err != nil {
			return err
		}
		if !targetExists || !followInserted {
			// Either the target user doesn't exist or already followed — no outbox event.
			return tx.Commit(ctx)
		}
		if _, err := tx.Exec(ctx,
			`UPDATE users SET follower_count = follower_count + 1 WHERE id = $1`,
			followeeID); err != nil {
			return err
		}
		payload := fmt.Sprintf(
			`{"op":"follow","actor_id":%q,"recipient_id":%q}`,
			followerID, followeeID,
		)
		if _, err := tx.Exec(ctx,
			`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, "activity", payload); err != nil {
			return err
		}
		return tx.Commit(ctx)
	})
	if err != nil {
		return err
	}
	if !targetExists {
		return store.ErrNotFound
	}
	return nil
}

func (r *UserRepository) UnfollowUser(ctx context.Context, followerID, followeeID string) error {
	return r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)
		tag, err := tx.Exec(ctx,
			`DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2`, followerID, followeeID)
		if err != nil {
			return err
		}
		if tag.RowsAffected() > 0 {
			if _, err := tx.Exec(ctx,
				`UPDATE users SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = $1`,
				followeeID); err != nil {
				return err
			}
		}
		payload := fmt.Sprintf(
			`{"op":"unfollow","actor_id":%q,"recipient_id":%q}`,
			followerID, followeeID,
		)
		if _, err := tx.Exec(ctx,
			`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, "activity", payload); err != nil {
			return err
		}
		return tx.Commit(ctx)
	})
}

func (r *UserRepository) UpdateUser(ctx context.Context, userID, name, username, email, avatar string, bio *string) (users.UpdateUserResult, error) {
	var result users.UpdateUserResult
	err := r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)

		var oldAvatar sql.NullString
		if err := tx.QueryRow(ctx, `SELECT avatar FROM users WHERE id = $1 FOR UPDATE`, userID).Scan(&oldAvatar); err != nil {
			return err
		}
		if avatar != "" {
			var avatarExists bool
			if err := tx.QueryRow(ctx, `SELECT EXISTS (
				  SELECT 1 FROM users WHERE id = $1 AND avatar = $2
				  UNION SELECT 1 FROM posts WHERE user_id = $1 AND filename = $2
				) AS exists`, userID, avatar).Scan(&avatarExists); err != nil {
				return err
			}
			if !avatarExists {
				var consumed string
				if err := tx.QueryRow(ctx, `DELETE FROM uploads WHERE user_id = $1 AND filename = $2
					RETURNING filename`, userID, avatar).Scan(&consumed); err != nil {
					return err
				}
			}
		}
		if _, err := tx.Exec(ctx, `UPDATE users SET name = $1, username = $2,
			email = $3, avatar = NULLIF($4, ''), bio = NULLIF($5, '') WHERE id = $6`,
			name, username, email, avatar, bio, userID); err != nil {
			return err
		}
		result.Updated = true
		if oldAvatar.Valid && oldAvatar.String != "" && oldAvatar.String != avatar {
			var stillUsed bool
			if err := tx.QueryRow(ctx, `SELECT EXISTS (
				  SELECT 1 FROM posts WHERE filename = $1
				  UNION SELECT 1 FROM users WHERE avatar = $1
				) AS exists`, oldAvatar.String).Scan(&stillUsed); err != nil {
				return err
			}
			if !stillUsed {
				result.UnusedAvatar = oldAvatar.String
			}
		}
		userIDInt, err := strconv.ParseInt(userID, 10, 64)
		if err != nil {
			return fmt.Errorf("invalid user id: %w", err)
		}
		bioStr := ""
		if bio != nil {
			bioStr = *bio
		}
		payload := fmt.Sprintf(
			`{"table":"users","op":"upsert","id":%d,"user_id":"%d","username":%q,"bio":%q}`,
			userIDInt, userIDInt, username, bioStr,
		)
		if _, err := tx.Exec(ctx,
			`INSERT INTO outbox (topic, payload) VALUES ($1, $2)`, "entity-changes", payload); err != nil {
			return err
		}
		return tx.Commit(ctx)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return users.UpdateUserResult{Updated: false}, nil
	}
	if err != nil {
		if database.UniqueViolation(err) {
			return users.UpdateUserResult{}, store.ErrConflict
		}
		return users.UpdateUserResult{}, err
	}
	return result, nil
}

func (r *UserRepository) ChangePassword(ctx context.Context, userID, passwordHash, currentSessionID string) error {
	return r.db.Write(ctx, func() error {
		tx, err := r.db.Pool().Begin(ctx)
		if err != nil {
			return err
		}
		defer database.Rollback(ctx, tx)
		if _, err := tx.Exec(ctx, `UPDATE users SET password = $1 WHERE id = $2`, passwordHash, userID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1 AND id != $2`,
			userID, r.db.HashSession(currentSessionID)); err != nil {
			return err
		}
		return tx.Commit(ctx)
	})
}

func (r *UserRepository) ListSuggestedUsers(ctx context.Context, viewerID string, limit int) ([]users.User, error) {
	var result []users.User
	err := r.db.Read(ctx, func() error {
		rows, err := r.db.Pool().Query(ctx, `SELECT `+userColumns+`
            FROM users u
            WHERE u.id != $1
              AND NOT EXISTS (
                SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = u.id
              )
            ORDER BY u.follower_count DESC
            LIMIT $2`, viewerID, limit)
		if err != nil {
			return err
		}
		defer rows.Close()
		result = []users.User{}
		for rows.Next() {
			var user users.User
			var avatar, bio sql.NullString
			if err := rows.Scan(&user.ID, &user.Name, &user.Username,
				&user.Email, &avatar, &bio, &user.Posts, &user.Likes,
				&user.Followers, &user.Following, &user.IsFollowing,
				&user.Created); err != nil {
				return err
			}
			user.Avatar = database.NullableString(avatar)
			user.Bio = database.NullableString(bio)
			result = append(result, user)
		}
		return rows.Err()
	})
	return result, err
}

var _ users.Repository = (*UserRepository)(nil)
