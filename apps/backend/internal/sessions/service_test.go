package sessions

import (
	"context"
	"errors"
	"testing"
	"time"

	"pixelgram/backend/internal/auth"
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
	updatedPasswordHash  string
	updatePasswordErr    error
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

func (r *fakeRepository) UpdatePasswordHash(_ context.Context, _ int, hash string) error {
	r.updatedPasswordHash = hash
	return r.updatePasswordErr
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

func TestServiceLoginVerifiesDecoyHashForUnknownAccount(t *testing.T) {
	now := time.Date(2026, time.June, 15, 12, 0, 0, 0, time.UTC)
	repository := &fakeRepository{} // no credentials: account does not exist
	service := newTestService(repository, now)
	called := false
	var gotHash string
	service.verifyPassword = func(_, hash string) (bool, error) {
		called = true
		gotHash = hash
		return false, nil
	}

	_, err := service.Login(context.Background(), LoginInput{
		Email:    "nobody@example.com",
		Password: "password123",
		ClientIP: "192.0.2.1",
	})

	if !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("Login() error = %v, want ErrInvalidCredentials", err)
	}
	if !called {
		t.Fatal("password verification must run even for a missing account (timing oracle)")
	}
	if gotHash != service.decoyHash {
		t.Fatalf("verified hash = %q, want decoy hash", gotHash)
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

func TestServiceLoginRehashesWeakHash(t *testing.T) {
	now := time.Date(2026, time.June, 15, 12, 0, 0, 0, time.UTC)
	// A hash with params below DefaultPasswordParams triggers a rehash.
	weakHash := "$argon2id$v=19$m=4096,t=1,p=1$c29tZXNhbHQ$dGVzdGhhc2g"
	repository := &fakeRepository{
		credentials: &UserCredentials{ID: 3, PasswordHash: weakHash},
	}
	service := newTestService(repository, now)
	service.verifyPassword = func(string, string) (bool, error) { return true, nil }
	service.hashPassword = func(password string, _ auth.PasswordParams) (string, error) {
		return "new-strong-hash", nil
	}

	_, err := service.Login(context.Background(), LoginInput{
		Email: "test@example.com", Password: "p", ClientIP: "192.0.2.1",
	})

	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}
	if repository.updatedPasswordHash != "new-strong-hash" {
		t.Fatalf("UpdatePasswordHash not called or wrong hash: %q", repository.updatedPasswordHash)
	}
}

func TestServiceLoginSkipsRehashForCurrentParams(t *testing.T) {
	now := time.Date(2026, time.June, 15, 12, 0, 0, 0, time.UTC)
	// A hash produced with DefaultPasswordParams should not be rehashed.
	repository := &fakeRepository{
		credentials: &UserCredentials{ID: 3, PasswordHash: currentParamsHash},
	}
	service := newTestService(repository, now)
	service.verifyPassword = func(string, string) (bool, error) { return true, nil }
	rehashCalled := false
	service.hashPassword = func(string, auth.PasswordParams) (string, error) {
		rehashCalled = true
		return "", nil
	}

	_, err := service.Login(context.Background(), LoginInput{
		Email: "test@example.com", Password: "p", ClientIP: "192.0.2.1",
	})

	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}
	if rehashCalled {
		t.Fatal("hashPassword should not be called for an at-target hash")
	}
}

func TestServiceLoginPersistErrorDoesNotFailLogin(t *testing.T) {
	now := time.Date(2026, time.June, 15, 12, 0, 0, 0, time.UTC)
	repository := &fakeRepository{
		credentials:       &UserCredentials{ID: 3, PasswordHash: "invalid-hash"},
		updatePasswordErr: errors.New("db down"),
	}
	service := newTestService(repository, now)
	service.verifyPassword = func(string, string) (bool, error) { return true, nil }
	service.hashPassword = func(string, auth.PasswordParams) (string, error) {
		return "new-hash", nil
	}

	_, err := service.Login(context.Background(), LoginInput{
		Email: "test@example.com", Password: "p", ClientIP: "192.0.2.1",
	})

	if err != nil {
		t.Fatalf("Login() error = %v, want nil (persist failure must not fail login)", err)
	}
}

// currentParamsHash is a valid Argon2id PHC hash at DefaultPasswordParams.
// Used to verify that an at-target hash is not rehashed.
const currentParamsHash = "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQxMjM0NTY3OA$hbwqGankDMxbQ5fN303ASdxPeikPPqvxOYodhOKwtOY"

func newTestService(repository Repository, now time.Time) *Service {
	service := NewService(repository)
	service.now = func() time.Time { return now }
	service.generateSessionID = func() (string, error) {
		return "AAAAAAAAAAAAAAAAAAAAAAAAAAAA", nil
	}
	// Use a no-op hasher by default so existing tests don't trigger slow rehashes.
	service.hashPassword = func(string, auth.PasswordParams) (string, error) {
		return "rehashed", nil
	}
	return service
}

var _ Repository = (*fakeRepository)(nil)
