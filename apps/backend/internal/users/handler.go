package users

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"pixelgram/backend/internal/auth"
	"pixelgram/backend/internal/compat"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/store"
	"pixelgram/backend/internal/uploads"
)

type Store interface {
	CreateUser(ctx context.Context, name, username, email, passwordHash string) (int, error)
	GetUser(ctx context.Context, userID, currentUserID string) (User, bool, error)
	GetUserWithID(ctx context.Context, userID string) (UserCredentials, bool, error)
	UpdateUser(ctx context.Context, userID, name, username, email, avatar string, bio *string) (UpdateUserResult, error)
	UpdatePassword(ctx context.Context, userID, passwordHash string) error
	DeleteOtherSessions(ctx context.Context, userID, currentSessionID string) error
	FollowUser(ctx context.Context, followerID, followeeID string) error
	UnfollowUser(ctx context.Context, followerID, followeeID string) error
}

type User struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	Avatar      *string   `json:"avatar"`
	Bio         *string   `json:"bio"`
	Posts       int       `json:"posts"`
	Likes       int       `json:"likes"`
	Followers   int       `json:"followers"`
	Following   int       `json:"following"`
	IsFollowing bool      `json:"isFollowing"`
	Created     time.Time `json:"created"`
}

type UserCredentials struct {
	ID           int
	PasswordHash string
}

type UpdateUserResult struct {
	Updated      bool
	UnusedAvatar string
}

type Handler struct {
	Store    Store
	ImageDir string
}

func (h Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
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
	username := strings.TrimSpace(body.Username)
	email := strings.ToLower(strings.TrimSpace(body.Email))

	if name == "" || username == "" || email == "" || body.Password == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Name, username, email and password are required.")
		return
	}

	if len(body.Password) < 8 || len(body.Password) > 128 {
		httpx.WriteMessage(w, http.StatusBadRequest, "Password must be between 8 and 128 characters long.")
		return
	}

	if !compat.ValidEmail(email) {
		httpx.WriteMessage(w, http.StatusBadRequest, "Invalid email address.")
		return
	}

	passwordHash, err := auth.HashPassword(body.Password, auth.DefaultPasswordParams)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Could not create user. Please try again.")
		return
	}

	id, err := h.Store.CreateUser(ctx, name, username, email, passwordHash)
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
	ctx := r.Context()
	userID := r.PathValue("userId")
	currentUserID, _ := httpx.UserID(r)

	user, found, err := h.Store.GetUser(ctx, userID, currentUserID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !found {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}

	// Email is private: only expose it on the requester's own profile.
	if currentUserID, ok := httpx.UserID(r); !ok || currentUserID != userID {
		user.Email = ""
	}

	httpx.WriteJSON(w, http.StatusOK, user)
}

func (h Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
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
	username := strings.TrimSpace(body.Username)
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if name == "" || username == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Name and username are required.")
		return
	}
	if !compat.ValidEmail(email) {
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

	result, err := h.Store.UpdateUser(ctx, userID, name, username, email, avatar, body.Bio)
	if err != nil {
		if errors.Is(err, store.ErrConflict) {
			httpx.WriteMessage(w, http.StatusConflict, "This username or email is already in use.")
			return
		}
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !result.Updated {
		httpx.WriteMessage(w, http.StatusBadRequest, "Avatar upload is invalid or expired.")
		return
	}

	if result.UnusedAvatar != "" {
		uploads.DeleteUploadFile(h.ImageDir, result.UnusedAvatar)
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) updatePassword(w http.ResponseWriter, r *http.Request, userID, oldPassword, password string) {
	ctx := r.Context()
	if oldPassword == "" || password == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Both password and the current password are required.")
		return
	}
	if len(password) < 8 || len(password) > 128 {
		httpx.WriteMessage(w, http.StatusBadRequest, "Password must be between 8 and 128 characters long.")
		return
	}

	user, found, err := h.Store.GetUserWithID(ctx, userID)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if !found {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
		return
	}

	valid, err := auth.VerifyPassword(oldPassword, user.PasswordHash)
	if err != nil || !valid {
		httpx.WriteMessage(w, http.StatusBadRequest, "Wrong password. Enter the correct current password.")
		return
	}

	passwordHash, err := auth.HashPassword(password, auth.DefaultPasswordParams)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if err := h.Store.UpdatePassword(ctx, userID, passwordHash); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	currentSessionID, _ := httpx.GetSessionCookie(r)
	if err := h.Store.DeleteOtherSessions(ctx, userID, currentSessionID); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) FollowUser(w http.ResponseWriter, r *http.Request) {
	h.updateFollow(w, r, h.Store.FollowUser)
}

func (h Handler) UnfollowUser(w http.ResponseWriter, r *http.Request) {
	h.updateFollow(w, r, h.Store.UnfollowUser)
}

func (h Handler) updateFollow(w http.ResponseWriter, r *http.Request, update func(context.Context, string, string) error) {
	ctx := r.Context()
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

	if err := update(ctx, currentUserID, targetUserID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			httpx.WriteMessage(w, http.StatusNotFound, "User Not Found")
			return
		}
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
