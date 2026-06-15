package users

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/store"
)

type fakeService struct {
	createID             int
	createErr            error
	createCommand        CreateUserCommand
	user                 User
	found                bool
	getErr               error
	profileCommand       UpdateProfileCommand
	profileOutcome       UpdateProfileOutcome
	profileErr           error
	passwordCommand      ChangePasswordCommand
	passwordOutcome      ChangePasswordOutcome
	passwordErr          error
	followCommand        FollowCommand
	followErr            error
	unfollowCommand      FollowCommand
	unfollowErr          error
	getByUsernameCurrent string
	getByID              string
}

func (s *fakeService) CreateUser(_ context.Context, command CreateUserCommand) (int, error) {
	s.createCommand = command
	return s.createID, s.createErr
}

func (s *fakeService) GetUserByUsername(_ context.Context, _, currentUserID string) (User, bool, error) {
	s.getByUsernameCurrent = currentUserID
	return s.user, s.found, s.getErr
}

func (s *fakeService) GetUserByID(_ context.Context, userID, _ string) (User, bool, error) {
	s.getByID = userID
	return s.user, s.found, s.getErr
}

func (s *fakeService) UpdateProfile(_ context.Context, command UpdateProfileCommand) (UpdateProfileOutcome, error) {
	s.profileCommand = command
	return s.profileOutcome, s.profileErr
}

func (s *fakeService) ChangePassword(_ context.Context, command ChangePasswordCommand) (ChangePasswordOutcome, error) {
	s.passwordCommand = command
	return s.passwordOutcome, s.passwordErr
}

func (s *fakeService) FollowUser(_ context.Context, command FollowCommand) error {
	s.followCommand = command
	return s.followErr
}

func (s *fakeService) UnfollowUser(_ context.Context, command FollowCommand) error {
	s.unfollowCommand = command
	return s.unfollowErr
}

func TestCreateUserValidation(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		message string
	}{
		{"missing field", `{"name":"Test","username":"test","email":"test@example.com"}`, "Name, username, email and password are required."},
		{"invalid username", `{"name":"Test","username":"bad-name","email":"test@example.com","password":"password123"}`, "Username must be 3-30 characters"},
		{"short password", `{"name":"Test","username":"test","email":"test@example.com","password":"short"}`, "Password must be between 8 and 128 characters long."},
		{"long password", `{"name":"Test","username":"test","email":"test@example.com","password":"` + strings.Repeat("a", 129) + `"}`, "Password must be between 8 and 128 characters long."},
		{"invalid email", `{"name":"Test","username":"test","email":"invalid","password":"password123"}`, "Invalid email address."},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := &fakeService{}
			res := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(test.body))

			NewHandler(service).CreateUser(res, req)

			if res.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d", res.Code, http.StatusBadRequest)
			}
			if !strings.Contains(res.Body.String(), test.message) {
				t.Fatalf("body = %q, want message %q", res.Body.String(), test.message)
			}
			if service.createCommand != (CreateUserCommand{}) {
				t.Fatal("invalid request reached service")
			}
		})
	}
}

func TestCreateUserNormalizesInput(t *testing.T) {
	service := &fakeService{createID: 12}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(`{
		"name":" Test User ",
		"username":" Test ",
		"email":" Test@Example.COM ",
		"password":" password123 "
	}`))

	NewHandler(service).CreateUser(res, req)

	if res.Code != http.StatusCreated || strings.TrimSpace(res.Body.String()) != `{"id":12}` {
		t.Fatalf("response = %d %q", res.Code, res.Body.String())
	}
	want := CreateUserCommand{
		Name: "Test User", Username: "test", Email: "test@example.com", Password: " password123 ",
	}
	if service.createCommand != want {
		t.Fatalf("command = %#v, want %#v", service.createCommand, want)
	}
}

func TestCreateUserErrors(t *testing.T) {
	tests := []struct {
		name    string
		err     error
		status  int
		message string
	}{
		{"conflict", store.ErrConflict, http.StatusConflict, "User with this username or email already exists."},
		{"internal", errors.New("database unavailable"), http.StatusInternalServerError, "Could not create user. Please try again."},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := &fakeService{createErr: test.err}
			res := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(
				`{"name":"Test","username":"test","email":"test@example.com","password":"password123"}`,
			))

			NewHandler(service).CreateUser(res, req)

			if res.Code != test.status || !strings.Contains(res.Body.String(), test.message) {
				t.Fatalf("response = %d %q", res.Code, res.Body.String())
			}
		})
	}
}

func TestGetUserHidesEmailFromOtherUsers(t *testing.T) {
	service := &fakeService{
		found: true,
		user: User{
			ID: 2, Username: "test", Email: "private@example.com",
			Created: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
		},
	}
	res := httptest.NewRecorder()
	req := httpx.WithUserID(httptest.NewRequest(http.MethodGet, "/users/test", nil), "1")
	req.SetPathValue("username", "TEST")

	NewHandler(service).GetUser(res, req)

	if res.Code != http.StatusOK || strings.Contains(res.Body.String(), "private@example.com") {
		t.Fatalf("response = %d %q", res.Code, res.Body.String())
	}
	if service.getByUsernameCurrent != "1" {
		t.Fatalf("current user ID = %q, want 1", service.getByUsernameCurrent)
	}
}

func TestGetUserNotFound(t *testing.T) {
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/users/missing", nil)
	req.SetPathValue("username", "missing")

	NewHandler(&fakeService{}).GetUser(res, req)

	if res.Code != http.StatusNotFound || !strings.Contains(res.Body.String(), "Not Found") {
		t.Fatalf("response = %d %q", res.Code, res.Body.String())
	}
}

func TestGetCurrentUserUsesSessionIdentity(t *testing.T) {
	service := &fakeService{found: true, user: User{ID: 7, Email: "private@example.com"}}
	res := httptest.NewRecorder()
	req := httpx.WithUserID(httptest.NewRequest(http.MethodGet, "/users/me", nil), "7")

	NewHandler(service).GetCurrentUser(res, req)

	if res.Code != http.StatusOK || !strings.Contains(res.Body.String(), `"email":"private@example.com"`) {
		t.Fatalf("response = %d %q", res.Code, res.Body.String())
	}
	if service.getByID != "7" {
		t.Fatalf("user ID = %q, want 7", service.getByID)
	}
}

func TestUpdateUserAuthorization(t *testing.T) {
	tests := []struct {
		name   string
		userID string
		status int
	}{
		{"unauthorized", "", http.StatusUnauthorized},
		{"forbidden", "1", http.StatusForbidden},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			res := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPut, "/users/2", strings.NewReader(`{}`))
			req.SetPathValue("userId", "2")
			if test.userID != "" {
				req = httpx.WithUserID(req, test.userID)
			}

			NewHandler(&fakeService{}).UpdateUser(res, req)

			if res.Code != test.status {
				t.Fatalf("status = %d, want %d", res.Code, test.status)
			}
		})
	}
}

func TestUpdateUserProfile(t *testing.T) {
	service := &fakeService{}
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "/users/1", strings.NewReader(`{
		"name":" Test User ","username":" Test ","email":" Test@Example.COM ","avatar":"avatar.jpg"
	}`))
	req.SetPathValue("userId", "1")
	req = httpx.WithUserID(req, "1")

	NewHandler(service).UpdateUser(res, req)

	if res.Code != http.StatusNoContent {
		t.Fatalf("response = %d %q", res.Code, res.Body.String())
	}
	if service.profileCommand.Name != "Test User" ||
		service.profileCommand.Username != "test" ||
		service.profileCommand.Email != "test@example.com" ||
		service.profileCommand.Avatar != "avatar.jpg" {
		t.Fatalf("command = %#v", service.profileCommand)
	}
}

func TestUpdateUserProfileOutcomes(t *testing.T) {
	tests := []struct {
		name    string
		outcome UpdateProfileOutcome
		err     error
		status  int
		message string
	}{
		{"invalid avatar", UpdateProfileInvalidAvatar, nil, http.StatusBadRequest, "Avatar upload is invalid or expired."},
		{"conflict", UpdateProfileUpdated, store.ErrConflict, http.StatusConflict, "This username or email is already in use."},
		{"internal", UpdateProfileUpdated, errors.New("failed"), http.StatusInternalServerError, "Internal Server Error"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := &fakeService{profileOutcome: test.outcome, profileErr: test.err}
			res := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPut, "/users/1", strings.NewReader(
				`{"name":"Test","username":"test","email":"test@example.com"}`,
			))
			req.SetPathValue("userId", "1")
			req = httpx.WithUserID(req, "1")

			NewHandler(service).UpdateUser(res, req)

			if res.Code != test.status || !strings.Contains(res.Body.String(), test.message) {
				t.Fatalf("response = %d %q", res.Code, res.Body.String())
			}
		})
	}
}

func TestUpdatePasswordOutcomes(t *testing.T) {
	tests := []struct {
		name    string
		outcome ChangePasswordOutcome
		err     error
		status  int
		message string
	}{
		{"changed", ChangePasswordChanged, nil, http.StatusNoContent, ""},
		{"missing user", ChangePasswordUserNotFound, nil, http.StatusNotFound, "Not Found"},
		{"wrong password", ChangePasswordWrongPassword, nil, http.StatusBadRequest, "Wrong password"},
		{"internal", ChangePasswordChanged, errors.New("failed"), http.StatusInternalServerError, "Internal Server Error"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := &fakeService{passwordOutcome: test.outcome, passwordErr: test.err}
			res := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPut, "/users/1", strings.NewReader(
				`{"oldPassword":"old-password","password":"new-password"}`,
			))
			req.SetPathValue("userId", "1")
			req.AddCookie(&http.Cookie{Name: "session", Value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAA"})
			req = httpx.WithUserID(req, "1")

			NewHandler(service).UpdateUser(res, req)

			if res.Code != test.status || !strings.Contains(res.Body.String(), test.message) {
				t.Fatalf("response = %d %q", res.Code, res.Body.String())
			}
			if test.err == nil && service.passwordCommand.CurrentSessionID != "AAAAAAAAAAAAAAAAAAAAAAAAAAAA" {
				t.Fatalf("session ID = %q", service.passwordCommand.CurrentSessionID)
			}
		})
	}
}

func TestFollowRoutes(t *testing.T) {
	service := &fakeService{}
	handler := NewHandler(service)

	followRes := httptest.NewRecorder()
	followReq := httpx.WithUserID(httptest.NewRequest(http.MethodPost, "/users/2/follow", nil), "1")
	followReq.SetPathValue("userId", "2")
	handler.FollowUser(followRes, followReq)

	unfollowRes := httptest.NewRecorder()
	unfollowReq := httpx.WithUserID(httptest.NewRequest(http.MethodDelete, "/users/2/follow", nil), "1")
	unfollowReq.SetPathValue("userId", "2")
	handler.UnfollowUser(unfollowRes, unfollowReq)

	want := FollowCommand{FollowerID: "1", FolloweeID: "2"}
	if followRes.Code != http.StatusNoContent || unfollowRes.Code != http.StatusNoContent {
		t.Fatalf("statuses = %d, %d", followRes.Code, unfollowRes.Code)
	}
	if service.followCommand != want || service.unfollowCommand != want {
		t.Fatalf("commands = %#v, %#v", service.followCommand, service.unfollowCommand)
	}
}

func TestFollowUserErrors(t *testing.T) {
	tests := []struct {
		name    string
		current string
		target  string
		err     error
		status  int
		message string
	}{
		{"unauthorized", "", "2", nil, http.StatusUnauthorized, "Unauthorized"},
		{"self", "1", "1", nil, http.StatusBadRequest, "Cannot follow yourself."},
		{"not found", "1", "2", store.ErrNotFound, http.StatusNotFound, "User Not Found"},
		{"internal", "1", "2", errors.New("failed"), http.StatusInternalServerError, "Internal Server Error"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := &fakeService{followErr: test.err}
			res := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/users/"+test.target+"/follow", nil)
			req.SetPathValue("userId", test.target)
			if test.current != "" {
				req = httpx.WithUserID(req, test.current)
			}

			NewHandler(service).FollowUser(res, req)

			if res.Code != test.status || !strings.Contains(res.Body.String(), test.message) {
				t.Fatalf("response = %d %q", res.Code, res.Body.String())
			}
		})
	}
}

func TestRegisterRoutes(t *testing.T) {
	service := &fakeService{createID: 1}
	handler := NewHandler(service)
	public := http.NewServeMux()
	protected := http.NewServeMux()
	RegisterPublicRoutes(public, handler)
	RegisterProtectedRoutes(protected, handler)

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(
		`{"name":"Test","username":"test","email":"test@example.com","password":"password123"}`,
	))
	public.ServeHTTP(res, req)
	if res.Code != http.StatusCreated {
		t.Fatalf("public route status = %d", res.Code)
	}

	res = httptest.NewRecorder()
	req = httpx.WithUserID(httptest.NewRequest(http.MethodGet, "/users/me", nil), "1")
	protected.ServeHTTP(res, req)
	if res.Code != http.StatusNotFound {
		t.Fatalf("protected route status = %d", res.Code)
	}
}
