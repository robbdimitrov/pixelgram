package app

import (
	"net/http"

	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/users"
)

type Config struct {
	ImageDir string
}

type Dependencies struct {
	Sessions httpx.SessionStore
	Users    users.Store
	Auth     sessions.Store
}

func New(_ Config, deps Dependencies) http.Handler {
	mux := http.NewServeMux()
	userHandler := users.Handler{Store: deps.Users}
	sessionHandler := sessions.Handler{Store: deps.Auth}

	mux.HandleFunc("POST /users", userHandler.CreateUser)
	mux.HandleFunc("POST /sessions", sessionHandler.CreateSession)
	mux.HandleFunc("DELETE /sessions", sessionHandler.DeleteSession)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httpx.WriteMessage(w, http.StatusNotFound, "Not Found")
	})

	return httpx.Chain(
		mux,
		httpx.SecurityHeaders,
		httpx.OriginGuard,
		httpx.RequireSession(deps.Sessions),
		httpx.RequestLogger,
	)
}
