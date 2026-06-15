package sessions

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type fakeService struct {
	loginInput      LoginInput
	loginOutput     LoginOutput
	loginErr        error
	logoutSessionID string
	logoutErr       error
}

func (s *fakeService) Login(_ context.Context, input LoginInput) (LoginOutput, error) {
	s.loginInput = input
	return s.loginOutput, s.loginErr
}

func (s *fakeService) Logout(_ context.Context, sessionID string) error {
	s.logoutSessionID = sessionID
	return s.logoutErr
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
