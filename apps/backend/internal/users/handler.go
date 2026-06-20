package users

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/pagination"
	"pixelgram/backend/internal/store"
	"pixelgram/backend/internal/validation"
)

type HandlerService interface {
	CreateUser(ctx context.Context, command CreateUserCommand) (int, error)
	GetUserByUsername(ctx context.Context, username, currentUserID string) (User, bool, error)
	GetUserByID(ctx context.Context, userID, currentUserID string) (User, bool, error)
	ListFollowers(ctx context.Context, query ListQuery) ([]User, *pagination.Cursor, error)
	ListFollowing(ctx context.Context, query ListQuery) ([]User, *pagination.Cursor, error)
	UpdateProfile(ctx context.Context, command UpdateProfileCommand) (UpdateProfileOutcome, error)
	ChangePassword(ctx context.Context, command ChangePasswordCommand) (ChangePasswordOutcome, error)
	FollowUser(ctx context.Context, command FollowCommand) error
	UnfollowUser(ctx context.Context, command FollowCommand) error
}

type Handler struct {
	Service HandlerService
}

func NewHandler(service HandlerService) Handler {
	return Handler{Service: service}
}

func (h Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name     string `json:"name"`
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !httpx.DecodeJSON(w, r, &body) {
		return
	}

	name := strings.TrimSpace(body.Name)
	username := strings.ToLower(strings.TrimSpace(body.Username))
	email := strings.ToLower(strings.TrimSpace(body.Email))

	if name == "" || username == "" || email == "" || body.Password == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Name, username, email and password are required.")
		return
	}
	if !validation.ValidUsername(username) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Username must be 3-30 characters and contain only lowercase letters, numbers, periods, or underscores.")
		return
	}
	if len(body.Password) < 8 || len(body.Password) > 128 {
		httpx.WriteMessage(w, http.StatusBadRequest, "Password must be between 8 and 128 characters long.")
		return
	}
	if !validation.ValidEmail(email) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid email address.")
		return
	}

	id, err := h.Service.CreateUser(r.Context(), CreateUserCommand{
		Name: name, Username: username, Email: email, Password: body.Password,
	})
	if err != nil {
		if errors.Is(err, store.ErrConflict) {
			httpx.WriteMessage(w, http.StatusConflict, "User with this username or email already exists.")
			return
		}
		httpx.WriteMessage(w, http.StatusInternalServerError, "Could not create user. Please try again.")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]int{"id": id})
}

func (h Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	username := strings.ToLower(r.PathValue("username"))
	currentUserID, _ := httpx.UserID(r)

	user, found, err := h.Service.GetUserByUsername(r.Context(), username, currentUserID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !found {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}

	if currentUserID, ok := httpx.UserID(r); !ok || currentUserID != strconv.Itoa(user.ID) {
		user.Email = ""
	}

	httpx.WriteJSON(w, http.StatusOK, user)
}

func (h Handler) ListFollowers(w http.ResponseWriter, r *http.Request) {
	h.listUsers(w, r, h.Service.ListFollowers)
}

func (h Handler) ListFollowing(w http.ResponseWriter, r *http.Request) {
	h.listUsers(w, r, h.Service.ListFollowing)
}

func (h Handler) listUsers(
	w http.ResponseWriter,
	r *http.Request,
	fetch func(context.Context, ListQuery) ([]User, *pagination.Cursor, error),
) {
	currentUserID, _ := httpx.UserID(r)
	page, ok := pagination.ParsePagination(r.URL.Query())
	if !ok {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid pagination parameters.")
		return
	}

	items, nextCursor, err := fetch(r.Context(), ListQuery{
		Username: strings.ToLower(r.PathValue("username")), CurrentUserID: currentUserID,
		Cursor: page.Cursor, Limit: page.Limit,
	})
	if err != nil {
		httpx.WriteStoreError(w, err)
		return
	}
	for i := range items {
		if strconv.Itoa(items[i].ID) != currentUserID {
			items[i].Email = ""
		}
	}

	httpx.WriteJSON(w, http.StatusOK, pagination.NewCursorPage(items, nextCursor))
}

func (h Handler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := httpx.UserID(r)
	if !ok {
		httpx.WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	user, found, err := h.Service.GetUserByID(r.Context(), currentUserID, currentUserID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !found {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, user)
}

func (h Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userId")
	currentUserID, ok := httpx.UserID(r)
	if !ok {
		httpx.WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	if userID != currentUserID {
		httpx.WriteMessage(w, http.StatusForbidden, "Forbidden")
		return
	}

	var body struct {
		Name        string  `json:"name"`
		Username    string  `json:"username"`
		Email       string  `json:"email"`
		Avatar      *string `json:"avatar"`
		Bio         *string `json:"bio"`
		Password    string  `json:"password"`
		OldPassword string  `json:"oldPassword"`
	}
	if !httpx.DecodeJSON(w, r, &body) {
		return
	}

	if body.Password != "" {
		h.updatePassword(w, r, userID, body.OldPassword, body.Password)
		return
	}

	name := strings.TrimSpace(body.Name)
	username := strings.ToLower(strings.TrimSpace(body.Username))
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if name == "" || username == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Name and username are required.")
		return
	}
	if !validation.ValidUsername(username) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Username must be 3-30 characters and contain only lowercase letters, numbers, periods, or underscores.")
		return
	}
	if !validation.ValidEmail(email) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid email address.")
		return
	}

	avatar := ""
	if body.Avatar != nil {
		avatar = *body.Avatar
	}
	if body.Bio != nil && len([]rune(*body.Bio)) > 300 {
		httpx.WriteMessage(w, http.StatusBadRequest, "Bio must be 300 characters or fewer.")
		return
	}

	outcome, err := h.Service.UpdateProfile(r.Context(), UpdateProfileCommand{
		UserID: userID, Name: name, Username: username, Email: email, Avatar: avatar, Bio: body.Bio,
	})
	if err != nil {
		if errors.Is(err, store.ErrConflict) {
			httpx.WriteMessage(w, http.StatusConflict, "This username or email is already in use.")
			return
		}
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if outcome == UpdateProfileInvalidAvatar {
		httpx.WriteMessage(w, http.StatusBadRequest, "Avatar upload is invalid or expired.")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) updatePassword(w http.ResponseWriter, r *http.Request, userID, oldPassword, password string) {
	if oldPassword == "" || password == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Both password and the current password are required.")
		return
	}
	if len(password) < 8 || len(password) > 128 {
		httpx.WriteMessage(w, http.StatusBadRequest, "Password must be between 8 and 128 characters long.")
		return
	}

	currentSessionID, _ := httpx.GetSessionCookie(r)
	outcome, err := h.Service.ChangePassword(r.Context(), ChangePasswordCommand{
		UserID: userID, CurrentPassword: oldPassword, NewPassword: password, CurrentSessionID: currentSessionID,
	})
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	switch outcome {
	case ChangePasswordUserNotFound:
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	case ChangePasswordWrongPassword:
		httpx.WriteMessage(w, http.StatusBadRequest, "Wrong password. Enter the correct current password.")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) FollowUser(w http.ResponseWriter, r *http.Request) {
	h.updateFollow(w, r, h.Service.FollowUser)
}

func (h Handler) UnfollowUser(w http.ResponseWriter, r *http.Request) {
	h.updateFollow(w, r, h.Service.UnfollowUser)
}

func (h Handler) updateFollow(
	w http.ResponseWriter,
	r *http.Request,
	update func(context.Context, FollowCommand) error,
) {
	currentUserID, ok := httpx.UserID(r)
	if !ok {
		httpx.WriteMessage(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	targetUserID := r.PathValue("userId")
	if currentUserID == targetUserID {
		httpx.WriteMessage(w, http.StatusBadRequest, "Cannot follow yourself.")
		return
	}

	err := update(r.Context(), FollowCommand{FollowerID: currentUserID, FolloweeID: targetUserID})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			httpx.WriteMessage(w, http.StatusNotFound, "User Not Found")
			return
		}
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
