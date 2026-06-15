package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jackc/pgx/v5"

	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/store"
	"pixelgram/backend/internal/users"
)

type UserRepository struct {
	db *database.DB
}

func NewUserRepository(client *Client) *UserRepository {
	return &UserRepository{db: client.db}
}

func (r *UserRepository) CreateUser(ctx context.Context, name, username, email, passwordHash string) (int, error) {
	if err := r.db.Allow(); err != nil {
		return 0, store.ErrUnavailable
	}
	var id int
	err := r.db.Pool().QueryRow(ctx, `INSERT INTO users (name, username, email, password)
		VALUES ($1, $2, $3, $4) RETURNING id`, name, username, email, passwordHash).Scan(&id)
	if err != nil {
		r.db.Failure(err)
		if database.UniqueViolation(err) {
			return 0, store.ErrConflict
		}
		return 0, err
	}
	r.db.Success()
	return id, nil
}

func (r *UserRepository) GetUserWithID(ctx context.Context, userID string) (users.UserCredentials, bool, error) {
	if err := r.db.Allow(); err != nil {
		return users.UserCredentials{}, false, store.ErrUnavailable
	}
	var user users.UserCredentials
	err := r.db.Retry(ctx, func() error {
		return r.db.Pool().QueryRow(ctx, `SELECT id, password FROM users WHERE id = $1`, userID).
			Scan(&user.ID, &user.PasswordHash)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		r.db.Success()
		return users.UserCredentials{}, false, nil
	}
	if err != nil {
		r.db.Failure(err)
		return users.UserCredentials{}, false, err
	}
	r.db.Success()
	return user, true, nil
}

func (r *UserRepository) GetUserByUsername(ctx context.Context, username, currentUserID string) (users.User, bool, error) {
	return r.getUser(ctx, "username", username, currentUserID)
}

func (r *UserRepository) GetUserByID(ctx context.Context, userID, currentUserID string) (users.User, bool, error) {
	return r.getUser(ctx, "id", userID, currentUserID)
}

func (r *UserRepository) getUser(ctx context.Context, column, value, currentUserID string) (users.User, bool, error) {
	if err := r.db.Allow(); err != nil {
		return users.User{}, false, store.ErrUnavailable
	}
	var user users.User
	var avatar, bio sql.NullString
	err := r.db.Retry(ctx, func() error {
		return r.db.Pool().QueryRow(ctx, `SELECT id, name, username, email, avatar, bio,
			(SELECT count(*) FROM posts WHERE user_id = users.id) AS posts,
			(SELECT count(*) FROM likes WHERE user_id = id) AS likes,
			(SELECT count(*) FROM follows WHERE followee_id = id) AS followers,
			(SELECT count(*) FROM follows WHERE follower_id = id) AS following,
			EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND followee_id = id) AS is_following,
			created FROM users WHERE `+column+` = $1`, value, currentUserID).Scan(
			&user.ID, &user.Name, &user.Username, &user.Email, &avatar, &bio,
			&user.Posts, &user.Likes, &user.Followers, &user.Following,
			&user.IsFollowing, &user.Created,
		)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		r.db.Success()
		return users.User{}, false, nil
	}
	if err != nil {
		r.db.Failure(err)
		return users.User{}, false, err
	}
	r.db.Success()
	user.Avatar = database.NullableString(avatar)
	user.Bio = database.NullableString(bio)
	return user, true, nil
}

func (r *UserRepository) FollowUser(ctx context.Context, followerID, followeeID string) error {
	if err := r.db.Allow(); err != nil {
		return store.ErrUnavailable
	}
	var targetExists bool
	err := r.db.Pool().QueryRow(ctx, `WITH target AS (
			SELECT id FROM users WHERE id = $2
		), inserted AS (
			INSERT INTO follows (follower_id, followee_id)
			SELECT $1, id FROM target ON CONFLICT DO NOTHING
		)
		SELECT EXISTS (SELECT 1 FROM target)`, followerID, followeeID).Scan(&targetExists)
	if err != nil {
		r.db.Failure(err)
		return err
	}
	r.db.Success()
	if !targetExists {
		return store.ErrNotFound
	}
	return nil
}

func (r *UserRepository) UnfollowUser(ctx context.Context, followerID, followeeID string) error {
	if err := r.db.Allow(); err != nil {
		return store.ErrUnavailable
	}
	_, err := r.db.Pool().Exec(ctx, `DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2`, followerID, followeeID)
	if err != nil {
		r.db.Failure(err)
		return err
	}
	r.db.Success()
	return nil
}

func (r *UserRepository) UpdateUser(ctx context.Context, userID, name, username, email, avatar string, bio *string) (users.UpdateUserResult, error) {
	if err := r.db.Allow(); err != nil {
		return users.UpdateUserResult{}, store.ErrUnavailable
	}
	tx, err := r.db.Pool().Begin(ctx)
	if err != nil {
		r.db.Failure(err)
		return users.UpdateUserResult{}, err
	}
	defer database.Rollback(ctx, tx)

	var oldAvatar sql.NullString
	err = tx.QueryRow(ctx, `SELECT avatar FROM users WHERE id = $1 FOR UPDATE`, userID).Scan(&oldAvatar)
	if errors.Is(err, pgx.ErrNoRows) {
		r.db.Success()
		return users.UpdateUserResult{Updated: false}, nil
	}
	if err != nil {
		r.db.Failure(err)
		return users.UpdateUserResult{}, err
	}
	if avatar != "" {
		var avatarExists bool
		err = tx.QueryRow(ctx, `SELECT EXISTS (
			  SELECT 1 FROM users WHERE id = $1 AND avatar = $2
			  UNION SELECT 1 FROM posts WHERE user_id = $1 AND filename = $2
			) AS exists`, userID, avatar).Scan(&avatarExists)
		if err != nil {
			r.db.Failure(err)
			return users.UpdateUserResult{}, err
		}
		if !avatarExists {
			var consumed string
			err = tx.QueryRow(ctx, `DELETE FROM uploads WHERE user_id = $1 AND filename = $2
				RETURNING filename`, userID, avatar).Scan(&consumed)
			if errors.Is(err, pgx.ErrNoRows) {
				r.db.Success()
				return users.UpdateUserResult{Updated: false}, nil
			}
			if err != nil {
				r.db.Failure(err)
				return users.UpdateUserResult{}, err
			}
		}
	}
	_, err = tx.Exec(ctx, `UPDATE users SET name = $1, username = $2,
		email = $3, avatar = NULLIF($4, ''), bio = NULLIF($5, '') WHERE id = $6`,
		name, username, email, avatar, bio, userID)
	if err != nil {
		r.db.Failure(err)
		if database.UniqueViolation(err) {
			return users.UpdateUserResult{}, store.ErrConflict
		}
		return users.UpdateUserResult{}, err
	}
	result := users.UpdateUserResult{Updated: true}
	if oldAvatar.Valid && oldAvatar.String != "" && oldAvatar.String != avatar {
		var stillUsed bool
		err = tx.QueryRow(ctx, `SELECT EXISTS (
			  SELECT 1 FROM posts WHERE filename = $1
			  UNION SELECT 1 FROM users WHERE avatar = $1
			) AS exists`, oldAvatar.String).Scan(&stillUsed)
		if err != nil {
			r.db.Failure(err)
			return users.UpdateUserResult{}, err
		}
		if !stillUsed {
			result.UnusedAvatar = oldAvatar.String
		}
	}
	if err := tx.Commit(ctx); err != nil {
		r.db.Failure(err)
		return users.UpdateUserResult{}, err
	}
	r.db.Success()
	return result, nil
}

func (r *UserRepository) ChangePassword(ctx context.Context, userID, passwordHash, currentSessionID string) error {
	if err := r.db.Allow(); err != nil {
		return store.ErrUnavailable
	}
	tx, err := r.db.Pool().Begin(ctx)
	if err != nil {
		r.db.Failure(err)
		return err
	}
	defer database.Rollback(ctx, tx)
	if _, err := tx.Exec(ctx, `UPDATE users SET password = $1 WHERE id = $2`, passwordHash, userID); err != nil {
		r.db.Failure(err)
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1 AND id != $2`,
		userID, r.db.HashSession(currentSessionID)); err != nil {
		r.db.Failure(err)
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		r.db.Failure(err)
		return err
	}
	r.db.Success()
	return nil
}

var _ users.Repository = (*UserRepository)(nil)
