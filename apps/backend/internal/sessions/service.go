package sessions

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"pixelgram/backend/internal/auth"
)

// targetPasswordParams is the current target for password hashing.
// On login, hashes with weaker parameters are silently upgraded.
var targetPasswordParams = auth.DefaultPasswordParams

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrLoginRateLimited   = errors.New("login rate limited")
)

type Service struct {
	repository        Repository
	now               func() time.Time
	generateSessionID func() (string, error)
	verifyPassword    func(string, string) (bool, error)
	hashPassword      func(string, auth.PasswordParams) (string, error)
	decoyHash         string
}

func NewService(repository Repository) *Service {
	return &Service{
		repository:        repository,
		now:               time.Now,
		generateSessionID: auth.GenerateSessionID,
		verifyPassword:    auth.VerifyPassword,
		hashPassword:      auth.HashPassword,
		decoyHash:         auth.DecoyHash(),
	}
}

func (s *Service) Login(ctx context.Context, input LoginInput) (LoginOutput, error) {
	keys := loginFailureKeys(input.ClientIP, input.Email)

	if err := s.repository.DeleteExpiredSessions(ctx); err != nil {
		return LoginOutput{}, err
	}
	if err := s.repository.DeleteExpiredLoginFailures(ctx); err != nil {
		return LoginOutput{}, err
	}

	failures, err := s.repository.GetLoginFailures(ctx, keys)
	if err != nil {
		return LoginOutput{}, err
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
	verified, err := s.verifyPassword(input.Password, hash)
	if err != nil {
		verified = false
	}
	if credentials == nil || !verified {
		s.recordLoginFailures(ctx, keys)
		return LoginOutput{}, ErrInvalidCredentials
	}

	if auth.NeedsRehash(credentials.PasswordHash, targetPasswordParams) {
		if newHash, err := s.hashPassword(input.Password, targetPasswordParams); err == nil {
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

	if err := s.repository.ClearLoginFailures(ctx, keys); err != nil {
		slog.Warn("failed to clear login failures", "error", err)
	}

	return LoginOutput{
		SessionID: sessionID,
		UserID:    session.UserID,
	}, nil
}

func (s *Service) Logout(ctx context.Context, sessionID string) error {
	return s.repository.DeleteSession(ctx, sessionID)
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
	resetAt := s.now().Add(rateLimitDuration)
	for _, key := range keys {
		_ = s.repository.RecordLoginFailure(ctx, key, resetAt)
	}
}
