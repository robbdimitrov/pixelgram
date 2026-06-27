package sessions

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"phasma/backend/internal/auth"
)

// targetPasswordParams is the current target for password hashing.
// On login, hashes with weaker parameters are silently upgraded.
var targetPasswordParams = auth.DefaultPasswordParams

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrLoginRateLimited   = errors.New("login rate limited")
	ErrSessionNotFound    = errors.New("session not found")
	ErrCurrentSession     = errors.New("cannot revoke current session")
)

type Service struct {
	repository        Repository
	throttle          LoginThrottle
	now               func() time.Time
	generateSessionID func() (string, error)
	verifyPassword    func(context.Context, string, string) (bool, error)
	hashPassword      func(context.Context, string, auth.PasswordParams) (string, error)
	decoyHash         string
}

func NewService(repository Repository, throttle LoginThrottle) *Service {
	return &Service{
		repository:        repository,
		throttle:          throttle,
		now:               time.Now,
		generateSessionID: auth.GenerateSessionID,
		verifyPassword:    auth.VerifyPassword,
		hashPassword:      auth.HashPassword,
		decoyHash:         auth.DecoyHash(),
	}
}

func (s *Service) Login(ctx context.Context, input LoginInput) (LoginOutput, error) {
	keys := loginFailureKeys(input.ClientIP, input.Email)

	failures, err := s.throttle.GetFailures(ctx, keys)
	if err != nil {
		slog.Warn("login throttle unavailable, failing open", "error", err)
		failures = nil
	}
	if rateLimited(failures, s.now()) {
		return LoginOutput{}, ErrLoginRateLimited
	}

	credentials, err := s.repository.FindLoginCredentialsByEmail(ctx, input.Email)
	if err != nil {
		return LoginOutput{}, err
	}

	// Always run password verification — against a decoy hash when no account
	// matches — so login latency doesn't reveal whether the email is registered
	// (user-enumeration timing oracle).
	hash := s.decoyHash
	if credentials != nil {
		hash = credentials.PasswordHash
	}
	verified, err := s.verifyPassword(ctx, input.Password, hash)
	if err != nil {
		verified = false
	}
	if credentials == nil || !verified {
		s.recordLoginFailures(ctx, keys)
		return LoginOutput{}, ErrInvalidCredentials
	}

	if auth.NeedsRehash(credentials.PasswordHash, targetPasswordParams) {
		if newHash, err := s.hashPassword(ctx, input.Password, targetPasswordParams); err == nil {
			if err := s.repository.UpdatePasswordHash(ctx, credentials.ID, newHash); err != nil {
				slog.Warn("failed to upgrade password hash", "error", err)
			}
		}
	}

	sessionID, err := s.generateSessionID()
	if err != nil {
		return LoginOutput{}, err
	}

	session, err := s.repository.CreateSession(
		ctx,
		sessionID,
		credentials.ID,
		s.now().Add(sessionDuration),
	)
	if err != nil {
		return LoginOutput{}, err
	}

	if err := s.throttle.Clear(ctx, keys); err != nil {
		slog.Warn("failed to clear login failures", "error", err)
	}

	return LoginOutput{
		SessionID: sessionID,
		UserID:    session.UserID,
		Username:  credentials.Username,
	}, nil
}

func (s *Service) Logout(ctx context.Context, sessionID string) error {
	return s.repository.DeleteSession(ctx, sessionID)
}

func (s *Service) ListActive(ctx context.Context, userID, currentSessionToken string) ([]Session, error) {
	return s.repository.ListActiveSessions(ctx, userID, currentSessionToken)
}

func (s *Service) Revoke(ctx context.Context, publicID, userID, currentSessionToken string) error {
	outcome, err := s.repository.DeleteSessionByID(ctx, publicID, userID, currentSessionToken)
	if err != nil {
		return err
	}
	switch outcome {
	case DeleteSessionDeleted:
		return nil
	case DeleteSessionCurrent:
		return ErrCurrentSession
	default:
		return ErrSessionNotFound
	}
}

func loginFailureKeys(clientIP, email string) []string {
	return []string{"ip:" + clientIP, "email:" + email}
}

func rateLimited(failures []LoginFailure, now time.Time) bool {
	for _, failure := range failures {
		if failure.Count >= failureThreshold(failure.Key) && failure.ResetAt.After(now) {
			return true
		}
	}
	return false
}

func failureThreshold(key string) int {
	if strings.HasPrefix(key, "email:") {
		return emailLoginFailures
	}
	return ipLoginFailures
}

func (s *Service) recordLoginFailures(ctx context.Context, keys []string) {
	for _, key := range keys {
		if err := s.throttle.RecordFailure(ctx, key); err != nil {
			slog.Warn("failed to record login failure", "error", err)
		}
	}
}
