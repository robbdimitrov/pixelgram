package main

import (
	"log/slog"
	"net/http"
	"os"

	"pixelgram/backend/internal/app"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/sessions"
	"time"
)

func main() {
	port := getenv("PORT", "8080")
	handler := app.New(app.Config{
		ImageDir: getenv("IMAGE_DIR", "/tmp"),
	}, app.Dependencies{
		Sessions: noopSessionStore{},
		Users:    noopUserStore{},
		Auth:     noopAuthStore{},
	})

	addr := ":" + port
	slog.Info("starting backend", "addr", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		slog.Error("backend stopped", "error", err)
		os.Exit(1)
	}
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

type noopSessionStore struct{}

func (noopSessionStore) GetSession(string) (httpx.Session, error) {
	return httpx.Session{}, nil
}

func (noopSessionStore) RefreshSession(string) (httpx.Session, error) {
	return httpx.Session{}, nil
}

type noopUserStore struct{}

func (noopUserStore) CreateUser(string, string, string, string) (int, error) {
	return 0, nil
}

type noopAuthStore struct{}

func (noopAuthStore) DeleteExpiredSessions() error {
	return nil
}

func (noopAuthStore) DeleteExpiredLoginFailures() error {
	return nil
}

func (noopAuthStore) GetLoginFailures([]string) ([]sessions.LoginFailure, error) {
	return nil, nil
}

func (noopAuthStore) RecordLoginFailure(string, time.Time) error {
	return nil
}

func (noopAuthStore) ClearLoginFailures([]string) error {
	return nil
}

func (noopAuthStore) GetUserWithEmail(string) (sessions.UserCredentials, bool, error) {
	return sessions.UserCredentials{}, false, nil
}

func (noopAuthStore) CreateSession(string, int, time.Time) (sessions.CreatedSession, error) {
	return sessions.CreatedSession{}, nil
}

func (noopAuthStore) DeleteSession(string) error {
	return nil
}
