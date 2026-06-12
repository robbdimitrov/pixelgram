package sessions

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"pixelgram/backend/internal/auth"
)

type fakeStore struct {
	user              UserCredentials
	found             bool
	failures          []LoginFailure
	err               error
	session           CreatedSession
	recordedFailures  int
	clearedFailures   bool
	deletedSession    string
	createdSessionID  string
	createdSessionUID int
}

func (s *fakeStore) DeleteExpiredSessions(_ context.Context) error {
	return s.err
}

func (s *fakeStore) DeleteExpiredLoginFailures(_ context.Context) error {
	return s.err
}

func (s *fakeStore) GetLoginFailures(_ context.Context, _ []string) ([]LoginFailure, error) {
	return s.failures, s.err
}

func (s *fakeStore) RecordLoginFailure(_ context.Context, _ string, _ time.Time) error {
	s.recordedFailures++
	return nil
}

func (s *fakeStore) ClearLoginFailures(_ context.Context, _ []string) error {
	s.clearedFailures = true
	return nil
}

func (s *fakeStore) GetUserWithEmail(_ context.Context, _ string) (UserCredentials, bool, error) {
	return s.user, s.found, s.err
}

func (s *fakeStore) CreateSession(_ context.Context, sessionID string, userID int, _ time.Time) (CreatedSession, error) {
	s.createdSessionID = sessionID
	s.createdSessionUID = userID
	if s.session.UserID == 0 {
		return CreatedSession{UserID: userID}, s.err
	}
	return s.session, s.err
}

func (s *fakeStore) DeleteSession(_ context.Context, sessionID string) error {
	s.deletedSession = sessionID
	return s.err
}

func TestCreateSessionMissingFields(t *testing.T) {
	store := &fakeStore{}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{"email":"test@example.com"}`))

	handler.CreateSession(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
	if store.recordedFailures != 0 {
		t.Fatal("missing fields should not record login failures")
	}
}

func TestCreateSessionRateLimited(t *testing.T) {
	store := &fakeStore{failures: []LoginFailure{{
		Key:     "ip:192.0.2.1",
		Count:   ipLoginFailures,
		ResetAt: time.Now().Add(time.Minute),
	}}}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{
		"email":"test@example.com",
		"password":"password123"
	}`))

	handler.CreateSession(res, req)

	if res.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusTooManyRequests)
	}
	if store.recordedFailures != 0 {
		t.Fatal("rate limited request should not record another failure")
	}
}

func TestCreateSessionEmailKeyDoesNotLockBelowThreshold(t *testing.T) {
	// A handful of failures on the email key must not lock the account; only
	// the IP key trips at the low threshold. This guards against the cheap
	// account-lockout DoS.
	store := &fakeStore{failures: []LoginFailure{{
		Key:     "email:test@example.com",
		Count:   ipLoginFailures,
		ResetAt: time.Now().Add(time.Minute),
	}}}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{
		"email":"test@example.com",
		"password":"password123"
	}`))

	handler.CreateSession(res, req)

	if res.Code == http.StatusTooManyRequests {
		t.Fatal("email key below its threshold must not rate limit")
	}
}

func TestCreateSessionInvalidCredentials(t *testing.T) {
	store := &fakeStore{}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{
		"email":"test@example.com",
		"password":"password123"
	}`))

	handler.CreateSession(res, req)

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusUnauthorized)
	}
	if store.recordedFailures != 2 {
		t.Fatalf("recorded failures = %d, want 2", store.recordedFailures)
	}
}

func TestCreateSessionSuccess(t *testing.T) {
	hash, err := auth.HashPassword("password123", auth.DefaultPasswordParams)
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	store := &fakeStore{
		user:  UserCredentials{ID: 7, PasswordHash: hash},
		found: true,
	}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{
		"email":" Test@Example.COM ",
		"password":"password123"
	}`))

	handler.CreateSession(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", res.Code, http.StatusOK, res.Body.String())
	}
	if !store.clearedFailures {
		t.Fatal("successful login should clear failures")
	}
	if !auth.ValidSessionID(store.createdSessionID) {
		t.Fatalf("created invalid session ID: %q", store.createdSessionID)
	}
	if store.createdSessionUID != 7 {
		t.Fatalf("created session user ID = %d, want 7", store.createdSessionUID)
	}
	if got := res.Header().Get("Set-Cookie"); !strings.Contains(got, "session=") || !strings.Contains(got, "HttpOnly") {
		t.Fatalf("Set-Cookie = %q", got)
	}
	if strings.TrimSpace(res.Body.String()) != `{"id":7}` {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestDeleteSessionMalformedCookie(t *testing.T) {
	store := &fakeStore{}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/sessions", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "not-a-valid-session"})

	handler.DeleteSession(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNoContent)
	}
	if store.deletedSession != "" {
		t.Fatal("malformed session should not hit store")
	}
}

func TestDeleteSessionStoreError(t *testing.T) {
	store := &fakeStore{err: errors.New("database unavailable")}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/sessions", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})

	handler.DeleteSession(res, req)

	if res.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusInternalServerError)
	}
}
