package sessions

import "time"

const (
	sessionDuration   = 7 * 24 * time.Hour
	rateLimitDuration = 15 * time.Minute

	// A low IP threshold limits brute-force attempts from one client. The
	// higher email threshold avoids making account lockout cheap.
	ipLoginFailures    = 5
	emailLoginFailures = 50
)

type UserCredentials struct {
	ID           int
	PasswordHash string
}

type LoginFailure struct {
	Key     string
	Count   int
	ResetAt time.Time
}

type CreatedSession struct {
	UserID int
}

type LoginInput struct {
	Email    string
	Password string
	ClientIP string
}

type LoginOutput struct {
	SessionID string
	UserID    int
}
