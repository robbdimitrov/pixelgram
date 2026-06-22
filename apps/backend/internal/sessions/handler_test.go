package sessions

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"pixelgram/backend/internal/httpx"
)

type fakeService struct {
	loginInput      LoginInput
	loginOutput     LoginOutput
	loginErr        error
	logoutSessionID string
	logoutErr       error
	listUserID      string
	listToken       string
	listSessions    []Session
	listErr         error
	revokePublicID  string
	revokeUserID    string
	revokeToken     string
	revokeErr       error
}

func (s *fakeService) Login(_ context.Context, input LoginInput) (LoginOutput, error) {
	s.loginInput = input
	return s.loginOutput, s.loginErr
}

func (s *fakeService) Logout(_ context.Context, sessionID string) error {
	s.logoutSessionID = sessionID
	return s.logoutErr
}

func (s *fakeService) ListActive(_ context.Context, userID, currentSessionToken string) ([]Session, error) {
	s.listUserID = userID
	s.listToken = currentSessionToken
	return s.listSessions, s.listErr
}

func (s *fakeService) Revoke(_ context.Context, publicID, userID, currentSessionToken string) error {
	s.revokePublicID = publicID
	s.revokeUserID = userID
	s.revokeToken = currentSessionToken
	return s.revokeErr
}

func TestCreateSessionMissingFields(t *testing.T) {
	service := &fakeService{}
	handler := NewHandler(service)
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{"email":"test@example.com"}`))

	handler.CreateSession(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
	if service.loginInput != (LoginInput{}) {
		t.Fatal("missing fields should not call service")
	}
}

func TestCreateSessionRateLimited(t *testing.T) {
	service := &fakeService{loginErr: ErrLoginRateLimited}
	handler := NewHandler(service)
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{
		"email":"test@example.com",
		"password":"password123"
	}`))

	handler.CreateSession(res, req)

	if res.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusTooManyRequests)
	}
	if strings.TrimSpace(res.Body.String()) != `{"message":"Incorrect email or password."}` {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestCreateSessionInvalidCredentials(t *testing.T) {
	service := &fakeService{loginErr: ErrInvalidCredentials}
	handler := NewHandler(service)
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{
		"email":"test@example.com",
		"password":"password123"
	}`))

	handler.CreateSession(res, req)

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusUnauthorized)
	}
}

func TestCreateSessionServiceError(t *testing.T) {
	service := &fakeService{loginErr: errors.New("database unavailable")}
	handler := NewHandler(service)
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{
		"email":"test@example.com",
		"password":"password123"
	}`))

	handler.CreateSession(res, req)

	if res.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusInternalServerError)
	}
}

func TestCreateSessionSuccess(t *testing.T) {
	service := &fakeService{loginOutput: LoginOutput{
		SessionID: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		UserID:    7,
	}}
	handler := NewHandler(service)
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/sessions", strings.NewReader(`{
		"email":" Test@Example.COM ",
		"password":"password123"
	}`))

	handler.CreateSession(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", res.Code, http.StatusOK, res.Body.String())
	}
	if service.loginInput.Email != "test@example.com" {
		t.Fatalf("service email = %q, want normalized email", service.loginInput.Email)
	}
	if service.loginInput.Password != "password123" {
		t.Fatalf("service password = %q", service.loginInput.Password)
	}
	if service.loginInput.ClientIP != "192.0.2.1" {
		t.Fatalf("service client IP = %q, want 192.0.2.1", service.loginInput.ClientIP)
	}
	if got := res.Header().Get("Set-Cookie"); !strings.Contains(got, "session=") || !strings.Contains(got, "HttpOnly") {
		t.Fatalf("Set-Cookie = %q", got)
	}
	if strings.TrimSpace(res.Body.String()) != `{"id":7}` {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestDeleteSessionMalformedCookie(t *testing.T) {
	service := &fakeService{}
	handler := NewHandler(service)
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/sessions", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "not-a-valid-session"})

	handler.DeleteSession(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNoContent)
	}
	if service.logoutSessionID != "" {
		t.Fatal("malformed session should not call service")
	}
}

func TestDeleteSessionServiceError(t *testing.T) {
	service := &fakeService{logoutErr: errors.New("database unavailable")}
	handler := NewHandler(service)
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/sessions", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})

	handler.DeleteSession(res, req)

	if res.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusInternalServerError)
	}
}

func TestListSessionsUsesAuthenticatedRequestState(t *testing.T) {
	created := time.Date(2026, time.June, 22, 12, 0, 0, 0, time.UTC)
	service := &fakeService{listSessions: []Session{{
		ID:        "01904d2e-7f4d-7c33-ae21-2f94737eaa10",
		Created:   created,
		ExpiresAt: created.Add(7 * 24 * time.Hour),
		Current:   true,
	}}}
	handler := NewHandler(service)
	res := httptest.NewRecorder()
	req := httpx.WithUserID(httptest.NewRequest(http.MethodGet, "/sessions", nil), "7")
	req.AddCookie(&http.Cookie{Name: "session", Value: "_-AAAAAAAAAAAAAAAAAAAAAAAAAA"})

	handler.ListSessions(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body = %s", res.Code, http.StatusOK, res.Body.String())
	}
	if service.listUserID != "7" || service.listToken != "_-AAAAAAAAAAAAAAAAAAAAAAAAAA" {
		t.Fatalf("service list args = %q, %q", service.listUserID, service.listToken)
	}
	want := `{"sessions":[{"id":"01904d2e-7f4d-7c33-ae21-2f94737eaa10","created":"2026-06-22T12:00:00Z","expiresAt":"2026-06-29T12:00:00Z","current":true}]}`
	if strings.TrimSpace(res.Body.String()) != want {
		t.Fatalf("body = %q, want %q", res.Body.String(), want)
	}
}

func TestListSessionsRequiresAuthenticatedRequestState(t *testing.T) {
	service := &fakeService{}
	handler := NewHandler(service)
	res := httptest.NewRecorder()

	handler.ListSessions(res, httptest.NewRequest(http.MethodGet, "/sessions", nil))

	if res.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusUnauthorized)
	}
	if service.listUserID != "" {
		t.Fatal("unauthenticated request should not call service")
	}
}

func TestListSessionsServiceError(t *testing.T) {
	service := &fakeService{listErr: errors.New("database unavailable")}
	handler := NewHandler(service)
	res := httptest.NewRecorder()
	req := httpx.WithUserID(httptest.NewRequest(http.MethodGet, "/sessions", nil), "7")
	req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})

	handler.ListSessions(res, req)

	if res.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusInternalServerError)
	}
}

func TestRevokeSessionStatusMapping(t *testing.T) {
	const publicID = "01904d2e-7f4d-7c33-ae21-2f94737eaa10"
	tests := []struct {
		name       string
		path       string
		serviceErr error
		wantStatus int
		called     bool
	}{
		{name: "success", path: "/sessions/" + publicID, wantStatus: http.StatusNoContent, called: true},
		{name: "malformed UUID", path: "/sessions/not-a-uuid", wantStatus: http.StatusBadRequest},
		{name: "missing or unowned", path: "/sessions/" + publicID, serviceErr: ErrSessionNotFound, wantStatus: http.StatusNotFound, called: true},
		{name: "current", path: "/sessions/" + publicID, serviceErr: ErrCurrentSession, wantStatus: http.StatusConflict, called: true},
		{name: "repository error", path: "/sessions/" + publicID, serviceErr: errors.New("database unavailable"), wantStatus: http.StatusInternalServerError, called: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := &fakeService{revokeErr: test.serviceErr}
			handler := NewHandler(service)
			res := httptest.NewRecorder()
			req := httpx.WithUserID(httptest.NewRequest(http.MethodDelete, test.path, nil), "7")
			req.SetPathValue("sessionId", strings.TrimPrefix(test.path, "/sessions/"))
			req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})

			handler.RevokeSession(res, req)

			if res.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d; body = %s", res.Code, test.wantStatus, res.Body.String())
			}
			if test.called {
				if service.revokePublicID != publicID || service.revokeUserID != "7" ||
					service.revokeToken != "AAAAAAAAAAAAAAAAAAAAAAAAAAAA" {
					t.Fatalf("service revoke args = %q, %q, %q",
						service.revokePublicID, service.revokeUserID, service.revokeToken)
				}
			} else if service.revokePublicID != "" {
				t.Fatal("invalid request should not call service")
			}
		})
	}
}

func TestRegisterRoutes(t *testing.T) {
	service := &fakeService{loginOutput: LoginOutput{
		SessionID: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		UserID:    7,
	}}
	public := http.NewServeMux()

	RegisterRoutes(public, service)

	login := httptest.NewRecorder()
	public.ServeHTTP(login, httptest.NewRequest(
		http.MethodPost,
		"/sessions",
		strings.NewReader(`{"email":"test@example.com","password":"password123"}`),
	))
	if login.Code != http.StatusOK {
		t.Fatalf("login status = %d, want %d", login.Code, http.StatusOK)
	}

	logout := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/sessions", nil)
	req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})
	public.ServeHTTP(logout, req)
	if logout.Code != http.StatusNoContent {
		t.Fatalf("logout status = %d, want %d", logout.Code, http.StatusNoContent)
	}
}

func TestRegisterProtectedRoutes(t *testing.T) {
	service := &fakeService{}
	protected := http.NewServeMux()
	RegisterProtectedRoutes(protected, NewHandler(service))

	list := httptest.NewRecorder()
	listReq := httpx.WithUserID(httptest.NewRequest(http.MethodGet, "/sessions", nil), "7")
	listReq.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})
	protected.ServeHTTP(list, listReq)
	if list.Code != http.StatusOK {
		t.Fatalf("list status = %d, want %d", list.Code, http.StatusOK)
	}

	revoke := httptest.NewRecorder()
	revokeReq := httpx.WithUserID(httptest.NewRequest(
		http.MethodDelete,
		"/sessions/01904d2e-7f4d-7c33-ae21-2f94737eaa10",
		nil,
	), "7")
	revokeReq.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})
	protected.ServeHTTP(revoke, revokeReq)
	if revoke.Code != http.StatusNoContent {
		t.Fatalf("revoke status = %d, want %d", revoke.Code, http.StatusNoContent)
	}
}
