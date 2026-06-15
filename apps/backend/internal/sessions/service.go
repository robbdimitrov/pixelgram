package sessions

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"pixelgram/backend/internal/auth"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrLoginRateLimited   = errors.New("login rate limited")
)

type Service struct {
	repository        Repository
	now               func() time.Time
	generateSessionID func() (string, error)
	verifyPassword    func(string, string) (bool, error)
}

func NewService(repository Repository) *Service {
	return &Service{
		repository:        repository,
		now:               time.Now,
		generateSessionID: auth.GenerateSessionID,
		verifyPassword:    auth.VerifyPassword,
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

	valid := false
	if credentials != nil {
		valid, err = s.verifyPassword(input.Password, credentials.PasswordHash)
		if err != nil {
			valid = false
		}
	}
	if !valid {
		s.recordLoginFailures(ctx, keys)
		return LoginOutput{}, ErrInvalidCredentials
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
