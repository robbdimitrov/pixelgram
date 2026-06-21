package postgres

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"

	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/env"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/sessions"
)

const (
	sessionTTL                     = 7 * 24 * time.Hour
	defaultSessionAbsoluteTTLHours = 720
)

type SessionRepository struct {
	db *database.DB
}

func NewSessionRepository(client *Client) *SessionRepository {
	return &SessionRepository{db: client.db}
}

func (r *SessionRepository) FindLoginCredentialsByEmail(ctx context.Context, email string) (*sessions.UserCredentials, error) {
	var credentials sessions.UserCredentials
	err := r.db.Read(ctx, func() error {
		return r.db.Pool().QueryRow(ctx, `SELECT id, password FROM users WHERE email = $1`, email).
			Scan(&credentials.ID, &credentials.PasswordHash)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &credentials, nil
}

func (r *SessionRepository) CreateSession(ctx context.Context, sessionID string, userID int, expiresAt time.Time) (sessions.CreatedSession, error) {
	var session sessions.CreatedSession
	err := r.db.Write(ctx, func() error {
		return r.db.Pool().QueryRow(ctx, `INSERT INTO sessions (id, user_id, expires_at)
			VALUES ($1, $2, $3) RETURNING user_id`,
			r.db.HashSession(sessionID), userID, expiresAt).Scan(&session.UserID)
	})
	if err != nil {
		return sessions.CreatedSession{}, err
	}
	return session, nil
}

func (r *SessionRepository) RefreshSession(ctx context.Context, sessionID string) (httpx.Session, error) {
	hashed := r.db.HashSession(sessionID)
	now := time.Now()
	absoluteTTLHours := sessionAbsoluteTTLHours()
	var session httpx.Session
	var userID int
	// Read (retried): the UPDATE only re-stamps expires_at to a deterministic
	// window, so a retry on transient contention is idempotent.
	err := r.db.Read(ctx, func() error {
		return r.db.Pool().QueryRow(ctx, `WITH refreshed AS (
			  UPDATE sessions SET expires_at = $2
			  WHERE id = $1 AND expires_at > now() AND expires_at < $3
			    AND created >= now() - ($4 * interval '1 hour')
			  RETURNING id, user_id
			)
			SELECT id, user_id FROM refreshed
			UNION ALL
			SELECT id, user_id FROM sessions
			WHERE id = $1 AND expires_at > now()
			  AND created >= now() - ($4 * interval '1 hour')
			  AND NOT EXISTS (SELECT 1 FROM refreshed)
			LIMIT 1`,
			hashed, now.Add(sessionTTL), now.Add(sessionTTL/2), absoluteTTLHours).
			Scan(&session.ID, &userID)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return httpx.Session{}, nil
	}
	if err != nil {
		return httpx.Session{}, err
	}
	session.UserID = strconv.Itoa(userID)
	return session, nil
}

func (r *SessionRepository) DeleteExpiredSessions(ctx context.Context) error {
	return r.exec(ctx,
		`DELETE FROM sessions
		WHERE expires_at <= now() OR created < now() - ($1 * interval '1 hour')`,
		sessionAbsoluteTTLHours(),
	)
}

func sessionAbsoluteTTLHours() int {
	return env.Int("SESSION_ABSOLUTE_TTL_HOURS", defaultSessionAbsoluteTTLHours)
}

func (r *SessionRepository) DeleteSession(ctx context.Context, sessionID string) error {
	return r.exec(ctx, `DELETE FROM sessions WHERE id = $1`, r.db.HashSession(sessionID))
}

func (r *SessionRepository) UpdatePasswordHash(ctx context.Context, userID int, hash string) error {
	return r.exec(ctx, `UPDATE users SET password = $1 WHERE id = $2`, hash, userID)
}

func (r *SessionRepository) exec(ctx context.Context, query string, args ...any) error {
	return r.db.Write(ctx, func() error {
		_, err := r.db.Pool().Exec(ctx, query, args...)
		return err
	})
}

var (
	_ sessions.Repository = (*SessionRepository)(nil)
	_ httpx.SessionStore  = (*SessionRepository)(nil)
)
