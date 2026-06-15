package postgres

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"

	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/store"
)

const sessionTTL = 7 * 24 * time.Hour

type SessionRepository struct {
	db *database.DB
}

func NewSessionRepository(client *Client) *SessionRepository {
	return &SessionRepository{db: client.db}
}

func (r *SessionRepository) FindLoginCredentialsByEmail(ctx context.Context, email string) (*sessions.UserCredentials, error) {
	if err := r.db.Allow(); err != nil {
		return nil, store.ErrUnavailable
	}
	var credentials sessions.UserCredentials
	err := r.db.Retry(ctx, func() error {
		return r.db.Pool().QueryRow(ctx, `SELECT id, password FROM users WHERE email = $1`, email).
			Scan(&credentials.ID, &credentials.PasswordHash)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		r.db.Success()
		return nil, nil
	}
	if err != nil {
		r.db.Failure(err)
		return nil, err
	}
	r.db.Success()
	return &credentials, nil
}

func (r *SessionRepository) CreateSession(ctx context.Context, sessionID string, userID int, expiresAt time.Time) (sessions.CreatedSession, error) {
	if err := r.db.Allow(); err != nil {
		return sessions.CreatedSession{}, store.ErrUnavailable
	}
	var session sessions.CreatedSession
	err := r.db.Pool().QueryRow(ctx, `INSERT INTO sessions (id, user_id, expires_at)
		VALUES ($1, $2, $3) RETURNING user_id`,
		r.db.HashSession(sessionID), userID, expiresAt).Scan(&session.UserID)
	if err != nil {
		r.db.Failure(err)
		return sessions.CreatedSession{}, err
	}
	r.db.Success()
	return session, nil
}

func (r *SessionRepository) RefreshSession(ctx context.Context, sessionID string) (httpx.Session, error) {
	if err := r.db.Allow(); err != nil {
		return httpx.Session{}, store.ErrUnavailable
	}
	hashed := r.db.HashSession(sessionID)
	var session httpx.Session
	var userID int
	err := r.db.Retry(ctx, func() error {
		return r.db.Pool().QueryRow(ctx, `WITH refreshed AS (
			  UPDATE sessions SET expires_at = $2
			  WHERE id = $1 AND expires_at > now() AND expires_at < $3
			  RETURNING id, user_id
			)
			SELECT id, user_id FROM refreshed
			UNION ALL
			SELECT id, user_id FROM sessions
			WHERE id = $1 AND expires_at > now()
			  AND NOT EXISTS (SELECT 1 FROM refreshed)
			LIMIT 1`,
			hashed, time.Now().Add(sessionTTL), time.Now().Add(sessionTTL/2)).
			Scan(&session.ID, &userID)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		r.db.Success()
		return httpx.Session{}, nil
	}
	if err != nil {
		r.db.Failure(err)
		return httpx.Session{}, err
	}
	r.db.Success()
	session.UserID = strconv.Itoa(userID)
	return session, nil
}

func (r *SessionRepository) DeleteExpiredSessions(ctx context.Context) error {
	return r.exec(ctx, `DELETE FROM sessions WHERE expires_at <= now()`)
}

func (r *SessionRepository) DeleteSession(ctx context.Context, sessionID string) error {
	return r.exec(ctx, `DELETE FROM sessions WHERE id = $1`, r.db.HashSession(sessionID))
}

func (r *SessionRepository) DeleteExpiredLoginFailures(ctx context.Context) error {
	return r.exec(ctx, `DELETE FROM login_failures WHERE reset_at <= now()`)
}

func (r *SessionRepository) GetLoginFailures(ctx context.Context, keys []string) ([]sessions.LoginFailure, error) {
	if err := r.db.Allow(); err != nil {
		return nil, store.ErrUnavailable
	}
	var failures []sessions.LoginFailure
	err := r.db.Retry(ctx, func() error {
		rows, err := r.db.Pool().Query(ctx,
			`SELECT key, count, reset_at FROM login_failures WHERE key = ANY($1)`, keys)
		if err != nil {
			return err
		}
		defer rows.Close()
		failures = []sessions.LoginFailure{}
		for rows.Next() {
			var failure sessions.LoginFailure
			if err := rows.Scan(&failure.Key, &failure.Count, &failure.ResetAt); err != nil {
				return err
			}
			failures = append(failures, failure)
		}
		return rows.Err()
	})
	if err != nil {
		r.db.Failure(err)
		return nil, err
	}
	r.db.Success()
	return failures, nil
}

func (r *SessionRepository) RecordLoginFailure(ctx context.Context, key string, resetAt time.Time) error {
	return r.exec(ctx, `INSERT INTO login_failures (key, count, reset_at) VALUES ($1, 1, $2)
		ON CONFLICT (key) DO UPDATE SET
		  count = CASE
		    WHEN login_failures.reset_at <= now() THEN 1
		    ELSE login_failures.count + 1
		  END,
		  reset_at = CASE
		    WHEN login_failures.reset_at <= now() THEN EXCLUDED.reset_at
		    ELSE login_failures.reset_at
		  END`, key, resetAt)
}

func (r *SessionRepository) ClearLoginFailures(ctx context.Context, keys []string) error {
	return r.exec(ctx, `DELETE FROM login_failures WHERE key = ANY($1)`, keys)
}

func (r *SessionRepository) exec(ctx context.Context, query string, args ...any) error {
	if err := r.db.Allow(); err != nil {
		return store.ErrUnavailable
	}
	if _, err := r.db.Pool().Exec(ctx, query, args...); err != nil {
		r.db.Failure(err)
		return err
	}
	r.db.Success()
	return nil
}

var (
	_ sessions.Repository = (*SessionRepository)(nil)
	_ httpx.SessionStore   = (*SessionRepository)(nil)
)
