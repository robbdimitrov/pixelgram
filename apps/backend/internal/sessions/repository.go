package sessions

import (
	"context"
	"time"
)

type Repository interface {
	DeleteExpiredSessions(ctx context.Context) error
	FindLoginCredentialsByEmail(ctx context.Context, email string) (*UserCredentials, error)
	CreateSession(ctx context.Context, sessionID string, userID int, expiresAt time.Time) (CreatedSession, error)
	DeleteSession(ctx context.Context, sessionID string) error
	UpdatePasswordHash(ctx context.Context, userID int, hash string) error
}
