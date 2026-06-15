package sessions

import (
	"context"
	"errors"
	"testing"
	"time"
)

type fakeRepository struct {
	credentials          *UserCredentials
	failures             []LoginFailure
	err                  error
	createdSession       CreatedSession
	createdSessionID     string
	createdSessionUser   int
	createdSessionExpiry time.Time
	recordedKeys         []string
	recordedResetAt      []time.Time
	clearedKeys          []string
	deletedSessionID     string
}

func (r *fakeRepository) DeleteExpiredSessions(context.Context) error {
	return r.err
}

func (r *fakeRepository) DeleteExpiredLoginFailures(context.Context) error {
	return r.err
}

func (r *fakeRepository) GetLoginFailures(context.Context, []string) ([]LoginFailure, error) {
	return r.failures, r.err
}

func (r *fakeRepository) RecordLoginFailure(_ context.Context, key string, resetAt time.Time) error {
	r.recordedKeys = append(r.recordedKeys, key)
	r.recordedResetAt = append(r.recordedResetAt, resetAt)
	return nil
}

func (r *fakeRepository) ClearLoginFailures(_ context.Context, keys []string) error {
	r.clearedKeys = append([]string(nil), keys...)
	return nil
}

func (r *fakeRepository) FindLoginCredentialsByEmail(context.Context, string) (*UserCredentials, error) {
	return r.credentials, r.err
}

func (r *fakeRepository) CreateSession(
	_ context.Context,
	sessionID string,
	userID int,
	expiresAt time.Time,
) (CreatedSession, error) {
	r.createdSessionID = sessionID
	r.createdSessionUser = userID
	r.createdSessionExpiry = expiresAt
	if r.createdSession.UserID == 0 {
		return CreatedSession{UserID: userID}, r.err
	}
	return r.createdSession, r.err
}

func (r *fakeRepository) DeleteSession(_ context.Context, sessionID string) error {
	r.deletedSessionID = sessionID
	return r.err
}

func TestServiceLoginRateLimitedByIP(t *testing.T) {
	now := time.Date(2026, time.June, 15, 12, 0, 0, 0, time.UTC)
	repository := &fakeRepository{failures: []LoginFailure{{
		Key:     "ip:192.0.2.1",
		Count:   ipLoginFailures,
		ResetAt: now.Add(time.Minute),
	}}}
	service := newTestService(repository, now)

	_, err := service.Login(context.Background(), LoginInput{
		Email:    "test@example.com",
		Password: "password123",
		ClientIP: "192.0.2.1",
	})

	if !errors.Is(err, ErrLoginRateLimited) {
		t.Fatalf("Login() error = %v, want ErrLoginRateLimited", err)
	}
	if len(repository.recordedKeys) != 0 {
		t.Fatal("rate-limited login should not record another failure")
	}
}

func TestServiceLoginEmailKeyUsesHigherThreshold(t *testing.T) {
	now := time.Date(2026, time.June, 15, 12, 0, 0, 0, time.UTC)
	repository := &fakeRepository{failures: []LoginFailure{{
		Key:     "email:test@example.com",
		Count:   ipLoginFailures,
		ResetAt: now.Add(time.Minute),
	}}}
	service := newTestService(repository, now)
	service.verifyPassword = func(string, string) (bool, error) { return false, nil }

	_, err := service.Login(context.Background(), LoginInput{
		Email:    "test@example.com",
		Password: "password123",
		ClientIP: "192.0.2.1",
	})

	if !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("Login() error = %v, want ErrInvalidCredentials", err)
	}
}

func TestServiceLoginInvalidCredentialsRecordsBothKeys(t *testing.T) {
	now := time.Date(2026, time.June, 15, 12, 0, 0, 0, time.UTC)
	repository := &fakeRepository{}
	service := newTestService(repository, now)

	_, err := service.Login(context.Background(), LoginInput{
		Email:    "test@example.com",
		Password: "password123",
		ClientIP: "192.0.2.1",
	})

	if !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("Login() error = %v, want ErrInvalidCredentials", err)
	}
	if len(repository.recordedKeys) != 2 {
		t.Fatalf("recorded keys = %v, want IP and email keys", repository.recordedKeys)
	}
	if repository.recordedKeys[0] != "ip:192.0.2.1" ||
		repository.recordedKeys[1] != "email:test@example.com" {
		t.Fatalf("recorded keys = %v", repository.recordedKeys)
	}
	for _, resetAt := range repository.recordedResetAt {
		if want := now.Add(rateLimitDuration); !resetAt.Equal(want) {
			t.Fatalf("reset at = %v, want %v", resetAt, want)
		}
	}
}

func TestServiceLoginSuccessCreatesSessionAndClearsFailures(t *testing.T) {
	now := time.Date(2026, time.June, 15, 12, 0, 0, 0, time.UTC)
	repository := &fakeRepository{
		credentials: &UserCredentials{ID: 7, PasswordHash: "encoded-hash"},
	}
	service := newTestService(repository, now)
	service.verifyPassword = func(password, hash string) (bool, error) {
		return password == "password123" && hash == "encoded-hash", nil
	}

	output, err := service.Login(context.Background(), LoginInput{
		Email:    "test@example.com",
		Password: "password123",
		ClientIP: "192.0.2.1",
	})

	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}
	if output != (LoginOutput{SessionID: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA", UserID: 7}) {
		t.Fatalf("Login() output = %+v", output)
	}
	if repository.createdSessionID != output.SessionID {
		t.Fatalf("created session ID = %q", repository.createdSessionID)
	}
	if repository.createdSessionUser != 7 {
		t.Fatalf("created session user ID = %d, want 7", repository.createdSessionUser)
	}
	if want := now.Add(sessionDuration); !repository.createdSessionExpiry.Equal(want) {
		t.Fatalf("session expiry = %v, want %v", repository.createdSessionExpiry, want)
	}
	if len(repository.clearedKeys) != 2 {
		t.Fatalf("cleared keys = %v, want IP and email keys", repository.clearedKeys)
	}
}

func TestServiceLoginPasswordVerificationErrorIsInvalidCredentials(t *testing.T) {
	now := time.Date(2026, time.June, 15, 12, 0, 0, 0, time.UTC)
	repository := &fakeRepository{
		credentials: &UserCredentials{ID: 7, PasswordHash: "malformed"},
	}
	service := newTestService(repository, now)
	service.verifyPassword = func(string, string) (bool, error) {
		return false, errors.New("invalid password hash")
	}

	_, err := service.Login(context.Background(), LoginInput{
		Email:    "test@example.com",
		Password: "password123",
		ClientIP: "192.0.2.1",
	})

	if !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("Login() error = %v, want ErrInvalidCredentials", err)
	}
	if len(repository.recordedKeys) != 2 {
		t.Fatalf("recorded keys = %v, want IP and email keys", repository.recordedKeys)
	}
}

func TestServiceLogoutDeletesSession(t *testing.T) {
	repository := &fakeRepository{}
	service := NewService(repository)

	err := service.Logout(context.Background(), "AAAAAAAAAAAAAAAAAAAAAAAAAAAA")

	if err != nil {
		t.Fatalf("Logout() error = %v", err)
	}
	if repository.deletedSessionID != "AAAAAAAAAAAAAAAAAAAAAAAAAAAA" {
		t.Fatalf("deleted session ID = %q", repository.deletedSessionID)
	}
}

func newTestService(repository Repository, now time.Time) *Service {
	service := NewService(repository)
	service.now = func() time.Time { return now }
	service.generateSessionID = func() (string, error) {
		return "AAAAAAAAAAAAAAAAAAAAAAAAAAAA", nil
	}
	return service
}

var _ Repository = (*fakeRepository)(nil)
