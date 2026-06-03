package users

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"pixelgram/backend/internal/store"
)

type fakeStore struct {
	id       int
	err      error
	created  bool
	name     string
	username string
	email    string
	hash     string
}

func (s *fakeStore) CreateUser(name, username, email, passwordHash string) (int, error) {
	s.created = true
	s.name = name
	s.username = username
	s.email = email
	s.hash = passwordHash
	return s.id, s.err
}

func TestCreateUserValidation(t *testing.T) {
	tests := []struct {
		name   string
		body   string
		status int
		msg    string
	}{
		{
			name:   "missing field",
			body:   `{"name":"Test","username":"test","email":"test@example.com"}`,
			status: http.StatusBadRequest,
			msg:    "Name, username, email and password are required.",
		},
		{
			name:   "short password",
			body:   `{"name":"Test","username":"test","email":"test@example.com","password":"short"}`,
			status: http.StatusBadRequest,
			msg:    "Password must be at least 8 characters long.",
		},
		{
			name:   "invalid email",
			body:   `{"name":"Test","username":"test","email":"invalid","password":"password123"}`,
			status: http.StatusBadRequest,
			msg:    "Invalid email address.",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{}
			handler := Handler{Store: store}
			res := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(tt.body))

			handler.CreateUser(res, req)

			if res.Code != tt.status {
				t.Fatalf("status = %d, want %d", res.Code, tt.status)
			}
			if !strings.Contains(res.Body.String(), tt.msg) {
				t.Fatalf("body = %q, want message %q", res.Body.String(), tt.msg)
			}
			if store.created {
				t.Fatal("invalid request should not create user")
			}
		})
	}
}

func TestCreateUserTrimsAndNormalizes(t *testing.T) {
	store := &fakeStore{id: 12}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(`{
		"name":" Test User ",
		"username":" test ",
		"email":" Test@Example.COM ",
		"password":" password123 "
	}`))

	handler.CreateUser(res, req)

	if res.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d; body=%s", res.Code, http.StatusCreated, res.Body.String())
	}
	if store.name != "Test User" || store.username != "test" || store.email != "test@example.com" {
		t.Fatalf("stored normalized fields = %q %q %q", store.name, store.username, store.email)
	}
	if !strings.HasPrefix(store.hash, "$argon2id$") {
		t.Fatalf("stored password hash = %q", store.hash)
	}
	if strings.TrimSpace(res.Body.String()) != `{"id":12}` {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestCreateUserConflict(t *testing.T) {
	handler := Handler{Store: &fakeStore{err: store.ErrConflict}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(`{
		"name":"Test",
		"username":"test",
		"email":"test@example.com",
		"password":"password123"
	}`))

	handler.CreateUser(res, req)

	if res.Code != http.StatusConflict {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusConflict)
	}
	if !strings.Contains(res.Body.String(), "User with this username or email already exists.") {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestCreateUserStoreError(t *testing.T) {
	handler := Handler{Store: &fakeStore{err: errors.New("database unavailable")}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(`{
		"name":"Test",
		"username":"test",
		"email":"test@example.com",
		"password":"password123"
	}`))

	handler.CreateUser(res, req)

	if res.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusInternalServerError)
	}
}
