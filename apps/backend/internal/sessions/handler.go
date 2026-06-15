package sessions

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"pixelgram/backend/internal/auth"
	"pixelgram/backend/internal/httpx"
)

type HandlerService interface {
	Login(ctx context.Context, input LoginInput) (LoginOutput, error)
	Logout(ctx context.Context, sessionID string) error
}

type Handler struct {
	Service HandlerService
}

func NewHandler(service HandlerService) Handler {
	return Handler{Service: service}
}

func (h Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !httpx.DecodeJSON(w, r, &body) {
		return
	}

	email := strings.ToLower(strings.TrimSpace(body.Email))
	if email == "" || body.Password == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Email and password are required.")
		return
	}

	output, err := h.Service.Login(r.Context(), LoginInput{
		Email:    email,
		Password: body.Password,
		ClientIP: httpx.ClientIP(r),
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrLoginRateLimited):
			httpx.WriteMessage(w, http.StatusTooManyRequests, "Incorrect email or password.")
		case errors.Is(err, ErrInvalidCredentials):
			httpx.WriteMessage(w, http.StatusUnauthorized, "Incorrect email or password.")
		default:
			httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		}
		return
	}

	httpx.SetSessionCookie(w, r, output.SessionID)
	httpx.WriteJSON(w, http.StatusOK, map[string]int{"id": output.UserID})
}

func (h Handler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	sessionID, ok := httpx.GetSessionCookie(r)
	if !ok || !auth.ValidSessionID(sessionID) {
		httpx.ClearSessionCookie(w, r)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if err := h.Service.Logout(r.Context(), sessionID); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	httpx.ClearSessionCookie(w, r)
	w.WriteHeader(http.StatusNoContent)
}
