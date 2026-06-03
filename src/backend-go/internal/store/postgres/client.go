package postgres

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"pixelgram/backend/internal/auth"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/store"
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
