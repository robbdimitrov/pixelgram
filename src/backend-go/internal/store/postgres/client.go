package postgres

import (
	"context"
	"database/sql"
	"errors"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"pixelgram/backend/internal/auth"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/images"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/store"
	"pixelgram/backend/internal/users"
)

type Client struct {
	pool          *pgxpool.Pool
	sessionSecret string
}

func New(ctx context.Context, databaseURL, sessionSecret string) (*Client, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	config.MaxConns = 10

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return &Client{
		pool:          pool,
		sessionSecret: sessionSecret,
	}, nil
}

func (c *Client) Close() {
	c.pool.Close()
}

func (c *Client) CreateUser(name, username, email, passwordHash string) (int, error) {
	var id int
	err := c.pool.QueryRow(
		context.Background(),
		`INSERT INTO users (name, username, email, password)
		VALUES ($1, $2, $3, $4) RETURNING id`,
		name,
		username,
		email,
		passwordHash,
	).Scan(&id)
	if err != nil {
		if uniqueViolation(err) {
			return 0, store.ErrConflict
		}
		return 0, err
	}

	return id, nil
}

func (c *Client) GetUserWithEmail(email string) (sessions.UserCredentials, bool, error) {
	var user sessions.UserCredentials
	err := c.pool.QueryRow(
		context.Background(),
		`SELECT id, password FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.PasswordHash)
	if errors.Is(err, pgx.ErrNoRows) {
		return sessions.UserCredentials{}, false, nil
	}
	if err != nil {
		return sessions.UserCredentials{}, false, err
	}

	return user, true, nil
}

func (c *Client) GetUserWithID(userID string) (users.UserCredentials, bool, error) {
	var user users.UserCredentials
	err := c.pool.QueryRow(
		context.Background(),
		`SELECT id, password FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.PasswordHash)
	if errors.Is(err, pgx.ErrNoRows) {
		return users.UserCredentials{}, false, nil
	}
	if err != nil {
		return users.UserCredentials{}, false, err
	}

	return user, true, nil
}

func (c *Client) GetUser(userID string) (users.User, bool, error) {
	var user users.User
	var avatar sql.NullString
	var bio sql.NullString
	err := c.pool.QueryRow(
		context.Background(),
		`SELECT id, name, username, email, avatar, bio,
		(SELECT count(*) FROM images WHERE user_id = users.id) AS images,
		(SELECT count(*) FROM likes WHERE user_id = id) AS likes,
		time_format(created) AS created
		FROM users WHERE id = $1`,
		userID,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Username,
		&user.Email,
		&avatar,
		&bio,
		&user.Images,
		&user.Likes,
		&user.Created,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return users.User{}, false, nil
	}
	if err != nil {
		return users.User{}, false, err
	}

	user.Avatar = nullableString(avatar)
	user.Bio = nullableString(bio)
	return user, true, nil
}

func (c *Client) UpdateUser(userID, name, username, email, avatar string, bio *string) (users.UpdateUserResult, error) {
	tx, err := c.pool.Begin(context.Background())
	if err != nil {
		return users.UpdateUserResult{}, err
	}
	defer rollback(context.Background(), tx)

	var oldAvatar sql.NullString
	err = tx.QueryRow(context.Background(), `SELECT avatar FROM users WHERE id = $1 FOR UPDATE`, userID).Scan(&oldAvatar)
	if errors.Is(err, pgx.ErrNoRows) {
		return users.UpdateUserResult{Updated: false}, nil
	}
	if err != nil {
		return users.UpdateUserResult{}, err
	}

	if avatar != "" {
		var avatarExists bool
		err := tx.QueryRow(
			context.Background(),
			`SELECT EXISTS (
			  SELECT 1 FROM users WHERE id = $1 AND avatar = $2
			  UNION
			  SELECT 1 FROM images WHERE user_id = $1 AND filename = $2
			) AS exists`,
			userID,
			avatar,
		).Scan(&avatarExists)
		if err != nil {
			return users.UpdateUserResult{}, err
		}

		if !avatarExists {
			var consumed string
			err := tx.QueryRow(
				context.Background(),
				`DELETE FROM uploads WHERE user_id = $1 AND filename = $2
				RETURNING filename`,
				userID,
				avatar,
			).Scan(&consumed)
			if errors.Is(err, pgx.ErrNoRows) {
				return users.UpdateUserResult{Updated: false}, nil
			}
			if err != nil {
				return users.UpdateUserResult{}, err
			}
		}
	}

	_, err = tx.Exec(
		context.Background(),
		`UPDATE users SET name = $1, username = $2,
		email = $3, avatar = $4, bio = $5 WHERE id = $6`,
		name,
		username,
		email,
		avatar,
		bio,
		userID,
	)
	if err != nil {
		if uniqueViolation(err) {
			return users.UpdateUserResult{}, store.ErrConflict
		}
		return users.UpdateUserResult{}, err
	}

	result := users.UpdateUserResult{Updated: true}
	if oldAvatar.Valid && oldAvatar.String != "" && oldAvatar.String != avatar {
		var stillUsed bool
		err := tx.QueryRow(
			context.Background(),
			`SELECT EXISTS (
			  SELECT 1 FROM images WHERE filename = $1
			  UNION
			  SELECT 1 FROM users WHERE avatar = $1
			) AS exists`,
			oldAvatar.String,
		).Scan(&stillUsed)
		if err != nil {
			return users.UpdateUserResult{}, err
		}
		if !stillUsed {
			result.UnusedAvatar = oldAvatar.String
		}
	}

	if err := tx.Commit(context.Background()); err != nil {
		return users.UpdateUserResult{}, err
	}
	return result, nil
}

func (c *Client) UpdatePassword(userID, passwordHash string) error {
	_, err := c.pool.Exec(context.Background(), `UPDATE users SET password = $1 WHERE id = $2`, passwordHash, userID)
	return err
}

func (c *Client) DeleteOtherSessions(userID, currentSessionID string) error {
	_, err := c.pool.Exec(
		context.Background(),
		`DELETE FROM sessions WHERE user_id = $1 AND id != $2`,
		userID,
		c.hashSession(currentSessionID),
	)
	return err
}

func (c *Client) CreateUpload(userID, filename string) error {
	_, err := c.pool.Exec(
		context.Background(),
		`INSERT INTO uploads (user_id, filename) VALUES ($1, $2)`,
		userID,
		filename,
	)
	return err
}

func (c *Client) HasPendingUploadCapacity(userID string) (bool, error) {
	var count int
	err := c.pool.QueryRow(
		context.Background(),
		`SELECT count(*) AS count FROM uploads WHERE user_id = $1`,
		userID,
	).Scan(&count)
	if err != nil {
		return false, err
	}

	return count < 20, nil
}

func (c *Client) DeleteExpiredUploads() ([]string, error) {
	rows, err := c.pool.Query(
		context.Background(),
		`DELETE FROM uploads
		WHERE created <= now() - $1::interval
		RETURNING filename`,
		"1 hour",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	filenames := []string{}
	for rows.Next() {
		var filename string
		if err := rows.Scan(&filename); err != nil {
			return nil, err
		}
		filenames = append(filenames, filename)
	}

	return filenames, rows.Err()
}

func (c *Client) CreateImage(userID, filename string, description *string) (int, bool, error) {
	tx, err := c.pool.Begin(context.Background())
	if err != nil {
		return 0, false, err
	}
	defer rollback(context.Background(), tx)

	var consumed string
	err = tx.QueryRow(
		context.Background(),
		`DELETE FROM uploads WHERE user_id = $1 AND filename = $2
		RETURNING filename`,
		userID,
		filename,
	).Scan(&consumed)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}

	var id int
	err = tx.QueryRow(
		context.Background(),
		`INSERT INTO images (user_id, filename, description)
		VALUES ($1, $2, $3) RETURNING id`,
		userID,
		filename,
		description,
	).Scan(&id)
	if err != nil {
		return 0, false, err
	}

	if err := tx.Commit(context.Background()); err != nil {
		return 0, false, err
	}
	return id, true, nil
}

func (c *Client) GetFeed(page, limit int, currentUserID string) ([]images.Image, error) {
	return c.queryImages(
		`SELECT id, user_id, filename, description,
		(SELECT count(*) FROM likes WHERE image_id = id) AS likes,
		EXISTS (SELECT 1 FROM likes
		WHERE image_id = id AND likes.user_id = $1) AS liked,
		time_format(created) AS created
		FROM images
		ORDER BY images.created DESC
		LIMIT $2 OFFSET $3`,
		currentUserID,
		limit,
		page*limit,
	)
}

func (c *Client) GetImages(userID string, page, limit int, currentUserID string) ([]images.Image, error) {
	return c.queryImages(
		`SELECT id, user_id, filename, description,
		(SELECT count(*) FROM likes WHERE image_id = id) AS likes,
		EXISTS (SELECT 1 FROM likes
		WHERE image_id = id AND likes.user_id = $1) AS liked,
		time_format(created) AS created
		FROM images WHERE user_id = $2
		ORDER BY images.created DESC
		LIMIT $3 OFFSET $4`,
		currentUserID,
		userID,
		limit,
		page*limit,
	)
}

func (c *Client) GetLikedImages(userID string, page, limit int, currentUserID string) ([]images.Image, error) {
	return c.queryImages(
		`SELECT id, images.user_id, filename, description,
		(SELECT count(*) FROM likes WHERE image_id = id) AS likes,
		EXISTS (SELECT 1 FROM likes
		WHERE image_id = id AND likes.user_id = $1) AS liked,
		time_format(images.created) AS created
		FROM images
		INNER JOIN likes ON image_id = id
		WHERE likes.user_id = $2
		ORDER BY likes.created DESC
		LIMIT $3 OFFSET $4`,
		currentUserID,
		userID,
		limit,
		page*limit,
	)
}

func (c *Client) GetImage(imageID, currentUserID string) (images.Image, bool, error) {
	result, err := c.queryImages(
		`SELECT id, user_id, filename, description,
		(SELECT count(*) FROM likes WHERE image_id = id) AS likes,
		EXISTS (SELECT 1 FROM likes
		WHERE image_id = id AND likes.user_id = $1) AS liked,
		time_format(created) AS created
		FROM images WHERE id = $2`,
		currentUserID,
		imageID,
	)
	if err != nil {
		return images.Image{}, false, err
	}
	if len(result) == 0 {
		return images.Image{}, false, nil
	}
	return result[0], true, nil
}

func (c *Client) DeleteImage(imageID, userID string) (string, bool, error) {
	tx, err := c.pool.Begin(context.Background())
	if err != nil {
		return "", false, err
	}
	defer rollback(context.Background(), tx)

	var filename string
	err = tx.QueryRow(
		context.Background(),
		`DELETE FROM images WHERE id = $1 AND user_id = $2 RETURNING filename`,
		imageID,
		userID,
	).Scan(&filename)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}

	_, err = tx.Exec(context.Background(), `UPDATE users SET avatar = $1 WHERE avatar = $2`, "", filename)
	if err != nil {
		return "", false, err
	}

	if err := tx.Commit(context.Background()); err != nil {
		return "", false, err
	}
	return filename, true, nil
}

func (c *Client) ImageExists(imageID string) (bool, error) {
	var exists bool
	err := c.pool.QueryRow(
		context.Background(),
		`SELECT EXISTS (SELECT 1 FROM images WHERE id = $1)`,
		imageID,
	).Scan(&exists)
	return exists, err
}

func (c *Client) LikeImage(imageID, userID string) error {
	_, err := c.pool.Exec(
		context.Background(),
		`INSERT INTO likes (user_id, image_id)
		SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM images WHERE id = $2)
		ON CONFLICT DO NOTHING`,
		userID,
		imageID,
	)
	return err
}

func (c *Client) UnlikeImage(imageID, userID string) error {
	_, err := c.pool.Exec(context.Background(), `DELETE FROM likes WHERE user_id = $1 AND image_id = $2`, userID, imageID)
	return err
}

func (c *Client) queryImages(query string, args ...any) ([]images.Image, error) {
	rows, err := c.pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []images.Image{}
	for rows.Next() {
		var image images.Image
		var description sql.NullString
		if err := rows.Scan(
			&image.ID,
			&image.UserID,
			&image.Filename,
			&description,
			&image.Likes,
			&image.Liked,
			&image.Created,
		); err != nil {
			return nil, err
		}
		image.Description = nullableString(description)
		result = append(result, image)
	}

	return result, rows.Err()
}

func (c *Client) CreateSession(sessionID string, userID int, expiresAt time.Time) (sessions.CreatedSession, error) {
	var session sessions.CreatedSession
	err := c.pool.QueryRow(
		context.Background(),
		`INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)
		RETURNING user_id`,
		c.hashSession(sessionID),
		userID,
		expiresAt,
	).Scan(&session.UserID)
	if err != nil {
		return sessions.CreatedSession{}, err
	}

	return session, nil
}

func (c *Client) GetSession(sessionID string) (httpx.Session, error) {
	var session httpx.Session
	var userID int
	err := c.pool.QueryRow(
		context.Background(),
		`SELECT id, user_id FROM sessions WHERE id = $1 AND expires_at > now()`,
		c.hashSession(sessionID),
	).Scan(&session.ID, &userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return httpx.Session{}, nil
	}
	if err != nil {
		return httpx.Session{}, err
	}

	session.UserID = strconv.Itoa(userID)
	return session, nil
}

func (c *Client) RefreshSession(sessionID string) (httpx.Session, error) {
	var session httpx.Session
	var userID int
	err := c.pool.QueryRow(
		context.Background(),
		`UPDATE sessions SET expires_at = $2 WHERE id = $1 AND expires_at > now()
		RETURNING id, user_id`,
		c.hashSession(sessionID),
		time.Now().Add(7*24*time.Hour),
	).Scan(&session.ID, &userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return httpx.Session{}, nil
	}
	if err != nil {
		return httpx.Session{}, err
	}

	session.UserID = strconv.Itoa(userID)
	return session, nil
}

func (c *Client) DeleteExpiredSessions() error {
	_, err := c.pool.Exec(context.Background(), `DELETE FROM sessions WHERE expires_at <= now()`)
	return err
}

func (c *Client) DeleteSession(sessionID string) error {
	_, err := c.pool.Exec(context.Background(), `DELETE FROM sessions WHERE id = $1`, c.hashSession(sessionID))
	return err
}

func (c *Client) DeleteExpiredLoginFailures() error {
	_, err := c.pool.Exec(context.Background(), `DELETE FROM login_failures WHERE reset_at <= now()`)
	return err
}

func (c *Client) GetLoginFailures(keys []string) ([]sessions.LoginFailure, error) {
	rows, err := c.pool.Query(
		context.Background(),
		`SELECT key, count, reset_at FROM login_failures WHERE key = ANY($1)`,
		keys,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	failures := []sessions.LoginFailure{}
	for rows.Next() {
		var failure sessions.LoginFailure
		if err := rows.Scan(&failure.Key, &failure.Count, &failure.ResetAt); err != nil {
			return nil, err
		}
		failures = append(failures, failure)
	}

	return failures, rows.Err()
}

func (c *Client) RecordLoginFailure(key string, resetAt time.Time) error {
	_, err := c.pool.Exec(
		context.Background(),
		`INSERT INTO login_failures (key, count, reset_at) VALUES ($1, 1, $2)
		ON CONFLICT (key) DO UPDATE SET
		  count = CASE
		    WHEN login_failures.reset_at <= now() THEN 1
		    ELSE login_failures.count + 1
		  END,
		  reset_at = CASE
		    WHEN login_failures.reset_at <= now() THEN EXCLUDED.reset_at
		    ELSE login_failures.reset_at
		  END`,
		key,
		resetAt,
	)
	return err
}

func (c *Client) ClearLoginFailures(keys []string) error {
	_, err := c.pool.Exec(context.Background(), `DELETE FROM login_failures WHERE key = ANY($1)`, keys)
	return err
}

func (c *Client) hashSession(sessionID string) string {
	return auth.HashSessionToken(sessionID, c.sessionSecret)
}

func uniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func nullableString(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}
