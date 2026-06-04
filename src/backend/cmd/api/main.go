package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"pixelgram/backend/internal/app"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/images"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/store/postgres"
	"pixelgram/backend/internal/users"
)

func main() {
	port := getenv("PORT", "8080")
	stores, closeStores, err := openStores()
	if err != nil {
		slog.Error("failed to initialize stores", "error", err)
		os.Exit(1)
	}
	defer closeStores()

	handler := app.New(app.Config{
		ImageDir: getenv("IMAGE_DIR", "/tmp"),
	}, stores)

	addr := ":" + port
	slog.Info("starting backend", "addr", addr)
	server := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	if err := server.ListenAndServe(); err != nil {
		slog.Error("backend stopped", "error", err)
		os.Exit(1)
	}
}

func openStores() (app.Stores, func(), error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return app.Stores{
			SessionAuth: noopSessionAuthStore{},
			Users:       noopUserStore{},
			Sessions:    noopSessionStore{},
			Uploads:     noopUploadStore{},
			Images:      noopImageStore{},
		}, func() {}, nil
	}

	client, err := postgres.New(context.Background(), databaseURL, os.Getenv("SESSION_HASH_SECRET"))
	if err != nil {
		return app.Stores{}, func() {}, err
	}

	return app.Stores{
		SessionAuth: client,
		Users:       client,
		Sessions:    client,
		Uploads:     client,
		Images:      client,
	}, client.Close, nil
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

type noopSessionAuthStore struct{}

func (noopSessionAuthStore) RefreshSession(string) (httpx.Session, error) {
	return httpx.Session{}, nil
}

type noopUserStore struct{}

func (noopUserStore) CreateUser(string, string, string, string) (int, error) {
	return 0, nil
}

func (noopUserStore) GetUser(string) (users.User, bool, error) {
	return users.User{}, false, nil
}

func (noopUserStore) GetUserWithID(string) (users.UserCredentials, bool, error) {
	return users.UserCredentials{}, false, nil
}

func (noopUserStore) UpdateUser(string, string, string, string, string, *string) (users.UpdateUserResult, error) {
	return users.UpdateUserResult{}, nil
}

func (noopUserStore) UpdatePassword(string, string) error {
	return nil
}

func (noopUserStore) DeleteOtherSessions(string, string) error {
	return nil
}

type noopSessionStore struct{}

func (noopSessionStore) DeleteExpiredSessions() error {
	return nil
}

func (noopSessionStore) DeleteExpiredLoginFailures() error {
	return nil
}

func (noopSessionStore) GetLoginFailures([]string) ([]sessions.LoginFailure, error) {
	return nil, nil
}

func (noopSessionStore) RecordLoginFailure(string, time.Time) error {
	return nil
}

func (noopSessionStore) ClearLoginFailures([]string) error {
	return nil
}

func (noopSessionStore) GetUserWithEmail(string) (sessions.UserCredentials, bool, error) {
	return sessions.UserCredentials{}, false, nil
}

func (noopSessionStore) CreateSession(string, int, time.Time) (sessions.CreatedSession, error) {
	return sessions.CreatedSession{}, nil
}

func (noopSessionStore) DeleteSession(string) error {
	return nil
}

type noopUploadStore struct{}

func (noopUploadStore) DeleteExpiredUploads() ([]string, error) {
	return nil, nil
}

func (noopUploadStore) HasPendingUploadCapacity(string) (bool, error) {
	return false, nil
}

func (noopUploadStore) CreateUpload(string, string) error {
	return nil
}

type noopImageStore struct{}

func (noopImageStore) CreateImage(string, string, *string) (int, bool, error) {
	return 0, false, nil
}

func (noopImageStore) GetFeed(int, int, string) ([]images.Image, error) {
	return nil, nil
}

func (noopImageStore) GetImages(string, int, int, string) ([]images.Image, error) {
	return nil, nil
}

func (noopImageStore) GetLikedImages(string, int, int, string) ([]images.Image, error) {
	return nil, nil
}

func (noopImageStore) GetImage(string, string) (images.Image, bool, error) {
	return images.Image{}, false, nil
}

func (noopImageStore) DeleteImage(string, string) (string, bool, error) {
	return "", false, nil
}

func (noopImageStore) ImageExists(string) (bool, error) {
	return false, nil
}

func (noopImageStore) LikeImage(string, string) error {
	return nil
}

func (noopImageStore) UnlikeImage(string, string) error {
	return nil
}
