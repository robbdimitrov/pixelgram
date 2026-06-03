package sessions

import (
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"pixelgram/backend/internal/auth"
	"pixelgram/backend/internal/httpx"
)

const (
	sessionDuration   = 7 * 24 * time.Hour
	rateLimitDuration = 15 * time.Minute
	maxLoginFailures  = 5
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
	DeleteExpiredSessions() error
	DeleteExpiredLoginFailures() error
	GetLoginFailures(keys []string) ([]LoginFailure, error)
	RecordLoginFailure(key string, resetAt time.Time) error
	ClearLoginFailures(keys []string) error
	GetUserWithEmail(email string) (UserCredentials, bool, error)
	CreateSession(sessionID string, userID int, expiresAt time.Time) (CreatedSession, error)
	DeleteSession(sessionID string) error
}

type Handler struct {
	Store Store
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
	rateLimitKeys := []string{"ip:" + clientIP(r), "email:" + email}
	if email == "" || body.Password == "" {
		httpx.WriteMessage(w, http.StatusBadRequest, "Email and password are required.")
		return
	}

	if err := h.Store.DeleteExpiredSessions(); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if err := h.Store.DeleteExpiredLoginFailures(); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	failures, err := h.Store.GetLoginFailures(rateLimitKeys)
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}
	if rateLimited(failures, time.Now()) {
		httpx.WriteMessage(w, http.StatusTooManyRequests, "Incorrect email or password.")
		return
	}

	user, found, err := h.Store.GetUserWithEmail(email)
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
		recordFailures(h.Store, rateLimitKeys)
		httpx.WriteMessage(w, http.StatusUnauthorized, "Incorrect email or password.")
		return
	}

	sessionID, err := auth.GenerateSessionID()
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	session, err := h.Store.CreateSession(sessionID, user.ID, time.Now().Add(sessionDuration))
	if err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	_ = h.Store.ClearLoginFailures(rateLimitKeys)
	httpx.SetSessionCookie(w, sessionID)
	httpx.WriteJSON(w, http.StatusOK, map[string]int{"id": session.UserID})
}

func (h Handler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err != nil || !auth.ValidSessionID(cookie.Value) {
		httpx.ClearSessionCookie(w)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if err := h.Store.DeleteSession(cookie.Value); err != nil {
		httpx.WriteMessage(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	httpx.ClearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func rateLimited(failures []LoginFailure, now time.Time) bool {
	for _, failure := range failures {
		if failure.Count >= maxLoginFailures && failure.ResetAt.After(now) {
			return true
		}
	}
	return false
}

func recordFailures(store Store, keys []string) {
	resetAt := time.Now().Add(rateLimitDuration)
	for _, key := range keys {
		_ = store.RecordLoginFailure(key, resetAt)
	}
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}

	if r.RemoteAddr == "" {
		return ""
	}

	if ip := net.ParseIP(r.RemoteAddr); ip != nil {
		return ip.String()
	}

	return strconv.Quote(r.RemoteAddr)
}
