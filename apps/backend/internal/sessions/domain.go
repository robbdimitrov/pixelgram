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
	Username     string
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

type Session struct {
	ID        string    `json:"id"`
	Created   time.Time `json:"created"`
	ExpiresAt time.Time `json:"expiresAt"`
	Current   bool      `json:"current"`
}

type DeleteSessionOutcome int

const (
	DeleteSessionNotFound DeleteSessionOutcome = iota
	DeleteSessionDeleted
	DeleteSessionCurrent
)

type LoginInput struct {
	Email    string
	Password string
	ClientIP string
}

type LoginOutput struct {
	SessionID string
	UserID    int
	Username  string
}
