package users

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"pixelgram/backend/internal/auth"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/store"
)

type fakeStore struct {
	id                 int
	err                error
	created            bool
	name               string
	username           string
	email              string
	hash               string
	user               User
	found              bool
	credentials        UserCredentials
	updated            UpdateUserResult
	updatedPassword    string
	deletedOtherUserID string
}

func (s *fakeStore) CreateUser(name, username, email, passwordHash string) (int, error) {
	s.created = true
	s.name = name
	s.username = username
	s.email = email
	s.hash = passwordHash
	return s.id, s.err
}

func (s *fakeStore) GetUser(string) (User, bool, error) {
	return s.user, s.found, s.err
}

func (s *fakeStore) GetUserWithID(string) (UserCredentials, bool, error) {
	return s.credentials, s.found, s.err
}

func (s *fakeStore) UpdateUser(_, name, username, email, _ string, _ *string) (UpdateUserResult, error) {
	s.name = name
	s.username = username
	s.email = email
	return s.updated, s.err
}

func (s *fakeStore) UpdatePassword(userID, passwordHash string) error {
	s.updatedPassword = passwordHash
	return s.err
}

func (s *fakeStore) DeleteOtherSessions(userID, _ string) error {
	s.deletedOtherUserID = userID
	return s.err
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

func TestGetUser(t *testing.T) {
	avatar := "avatar.jpg"
	bio := "hello"
	handler := Handler{Store: &fakeStore{
		found: true,
		user: User{
			ID:       1,
			Name:     "Test",
			Username: "test",
			Email:    "test@example.com",
			Avatar:   &avatar,
			Bio:      &bio,
			Images:   2,
			Likes:    3,
			Created:  "2026-01-01T00:00:00.000Z",
		},
	}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/users/1", nil)
	req.SetPathValue("userId", "1")

	handler.GetUser(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if !strings.Contains(res.Body.String(), `"username":"test"`) {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestGetUserNotFound(t *testing.T) {
	handler := Handler{Store: &fakeStore{}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/users/999", nil)
	req.SetPathValue("userId", "999")

	handler.GetUser(res, req)

	if res.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusNotFound)
	}
}

func TestUpdateUserForbidden(t *testing.T) {
	handler := Handler{Store: &fakeStore{}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/users/2", strings.NewReader(`{}`))
	req.SetPathValue("userId", "2")

	handler.UpdateUser(res, req)

	if res.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusForbidden)
	}
}

func TestUpdateUserProfile(t *testing.T) {
	store := &fakeStore{updated: UpdateUserResult{Updated: true}}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/users/1", strings.NewReader(`{
		"name":" Test User ",
		"username":" test ",
		"email":" Test@Example.COM "
	}`))
	req.SetPathValue("userId", "1")
	req = httpx.WithUserID(req, "1")

	handler.UpdateUser(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d; body=%s", res.Code, http.StatusNoContent, res.Body.String())
	}
	if store.name != "Test User" || store.username != "test" || store.email != "test@example.com" {
		t.Fatalf("stored normalized fields = %q %q %q", store.name, store.username, store.email)
	}
}

func TestUpdateUserInvalidAvatar(t *testing.T) {
	handler := Handler{Store: &fakeStore{updated: UpdateUserResult{Updated: false}}}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/users/1", strings.NewReader(`{
		"name":"Test",
		"username":"test",
		"email":"test@example.com",
		"avatar":"missing.jpg"
	}`))
	req.SetPathValue("userId", "1")
	req = httpx.WithUserID(req, "1")

	handler.UpdateUser(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
	}
	if !strings.Contains(res.Body.String(), "Avatar upload is invalid or expired.") {
		t.Fatalf("body = %q", res.Body.String())
	}
}

func TestUpdatePassword(t *testing.T) {
	oldHash, err := auth.HashPassword("old-password", auth.DefaultPasswordParams)
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	store := &fakeStore{
		found:       true,
		credentials: UserCredentials{ID: 1, PasswordHash: oldHash},
	}
	handler := Handler{Store: store}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/users/1", strings.NewReader(`{
		"oldPassword":"old-password",
		"password":"new-password"
	}`))
	req.SetPathValue("userId", "1")
	req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})
	req = httpx.WithUserID(req, "1")

	handler.UpdateUser(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d; body=%s", res.Code, http.StatusNoContent, res.Body.String())
	}
	if store.updatedPassword == "" {
		t.Fatal("expected password hash update")
	}
	if store.deletedOtherUserID != "1" {
		t.Fatalf("deleted sessions for user %q, want 1", store.deletedOtherUserID)
	}
}
