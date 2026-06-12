package sessions

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"pixelgram/backend/internal/auth"
	"pixelgram/backend/internal/httpx"
)

const (
	sessionDuration   = 7 * 24 * time.Hour
	rateLimitDuration = 15 * time.Minute
	// ipLoginFailures throttles brute-forcing from a single client (the IP key
	// is trustworthy now that the proxy overwrites X-Forwarded-For). The email
	// key uses a much higher threshold so an attacker cannot cheaply lock a
	// victim's account, while still bounding distributed credential stuffing.
	ipLoginFailures    = 5
	emailLoginFailures = 50
)

type UserCredentials struct {
	ID           int
	PasswordHash string
}

type LoginFailure struct {
	Key     string
	Count   int
	ResetAt time.Time
}

type CreatedSession struct {
	UserID int
}

type Store interface {
	DeleteExpiredSessions(ctx context.Context) error
	DeleteExpiredLoginFailures(ctx context.Context) error
	GetLoginFailures(ctx context.Context, keys []string) ([]LoginFailure, error)
	RecordLoginFailure(ctx context.Context, key string, resetAt time.Time) error
	ClearLoginFailures(ctx context.Context, keys []string) error
	GetUserWithEmail(ctx context.Context, email string) (UserCredentials, bool, error)
	CreateSession(ctx context.Context, sessionID string, userID int, expiresAt time.Time) (CreatedSession, error)
	DeleteSession(ctx context.Context, sessionID string) error
}

type Handler struct {
	Store Store
}

func (h Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !httpx.DecodeJSON(w, r, &body) {
		return
	}

	email := strings.ToLower(strings.TrimSpace(body.Email))
	rateLimitKeys := []string{"ip:" + httpx.ClientIP(r), "email:" + email}
	if email == "" || body.Password == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Email and password are required.")
		return
	}

	if err := h.Store.DeleteExpiredSessions(ctx); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if err := h.Store.DeleteExpiredLoginFailures(ctx); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	failures, err := h.Store.GetLoginFailures(ctx, rateLimitKeys)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if rateLimited(failures, time.Now()) {
		httpx.WriteMessage(w, http.StatusTooManyRequests, "Incorrect email or password.")
		return
	}

	user, found, err := h.Store.GetUserWithEmail(ctx, email)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	valid := false
	if found {
		valid, err = auth.VerifyPassword(body.Password, user.PasswordHash)
		if err != nil {
			valid = false
		}
	}

	if !valid {
		recordFailures(ctx, h.Store, rateLimitKeys)
		httpx.WriteMessage(w, http.StatusUnauthorized, "Incorrect email or password.")
		return
	}

	sessionID, err := auth.GenerateSessionID()
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	session, err := h.Store.CreateSession(ctx, sessionID, user.ID, time.Now().Add(sessionDuration))
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	if err := h.Store.ClearLoginFailures(ctx, rateLimitKeys); err != nil {
		slog.Warn("failed to clear login failures", "error", err)
	}
	httpx.SetSessionCookie(w, r, sessionID)
	httpx.WriteJSON(w, http.StatusOK, map[string]int{"id": session.UserID})
}

func (h Handler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	sessionID, ok := httpx.GetSessionCookie(r)
	if !ok || !auth.ValidSessionID(sessionID) {
		httpx.ClearSessionCookie(w, r)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if err := h.Store.DeleteSession(ctx, sessionID); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	httpx.ClearSessionCookie(w, r)
	w.WriteHeader(http.StatusNoContent)
}

func rateLimited(failures []LoginFailure, now time.Time) bool {
	for _, failure := range failures {
		if failure.Count >= failureThreshold(failure.Key) && failure.ResetAt.After(now) {
			return true
		}
	}
	return false
}

func failureThreshold(key string) int {
	if strings.HasPrefix(key, "email:") {
		return emailLoginFailures
	}
	return ipLoginFailures
}

func recordFailures(ctx context.Context, store Store, keys []string) {
	resetAt := time.Now().Add(rateLimitDuration)
	for _, key := range keys {
		_ = store.RecordLoginFailure(ctx, key, resetAt)
	}
}
