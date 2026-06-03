package users

import (
	"errors"
	"net/http"
	"strings"

	"pixelgram/backend/internal/auth"
	"pixelgram/backend/internal/compat"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/store"
)

type Store interface {
	CreateUser(name, username, email, passwordHash string) (int, error)
}

type Handler struct {
	Store Store
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
	username := strings.TrimSpace(body.Username)
	email := strings.ToLower(strings.TrimSpace(body.Email))

	if name == "" || username == "" || email == "" || body.Password == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Name, username, email and password are required.")
		return
	}

	if len(body.Password) < 8 {
		httpx.WriteMessage(w, http.StatusBadRequest, "Password must be at least 8 characters long.")
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

	id, err := h.Store.CreateUser(name, username, email, passwordHash)
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
