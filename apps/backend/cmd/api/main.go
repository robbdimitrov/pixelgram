package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/robbdimitrov/pixelgram/apps/backend/internal/app"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/comments"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/httpx"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/posts"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/sessions"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/store/postgres"
	"github.com/robbdimitrov/pixelgram/apps/backend/internal/users"
)

func main() {
	setupLogger()

	port := getenv("PORT", "8080")
	databaseURL := os.Getenv("DATABASE_URL")

	stores, closeStores, err := openStores(databaseURL)
	if err != nil {
		slog.Error("failed to initialize stores", "error", err)
		os.Exit(1)
	}
	defer closeStores()

	rateLimiter := openRateLimiter(databaseURL)
	startRateLimiterCleanup(rateLimiter)

	handler := app.New(app.Config{
		ImageDir:    getenv("IMAGE_DIR", "/tmp"),
		RateLimiter: rateLimiter,
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

	serverErrors := make(chan error, 1)
	go func() {
		serverErrors <- server.ListenAndServe()
	}()

	signalContext, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			slog.Error("backend stopped", "error", err)
			os.Exit(1)
		}
	case <-signalContext.Done():
		slog.Info("stopping backend")
	}

	shutdownContext, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownContext); err != nil {
		slog.Error("failed to stop backend", "error", err)
		os.Exit(1)
	}
}

func setupLogger() {
	level := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "debug" {
		level = slog.LevelDebug
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})))
}

func openStores(databaseURL string) (app.Stores, func(), error) {
	if databaseURL == "" {
		return app.Stores{
			SessionAuth: noopSessionAuthStore{},
			Users:       noopUserStore{},
			Sessions:    noopSessionStore{},
			Uploads:     noopUploadStore{},
			Posts:       noopPostStore{},
			Comments:    noopCommentStore{},
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
		Posts:       client,
		Comments:    client,
	}, client.Close, nil
}

func openRateLimiter(databaseURL string) httpx.RateLimiterStore {
	if databaseURL == "" {
		return httpx.NoopRateLimiterStore{}
	}
	return httpx.NewPostgresRateLimiterStore(databaseURL)
}

func startRateLimiterCleanup(store httpx.RateLimiterStore) {
	interval := time.Duration(envInt("RATE_LIMIT_CLEANUP_INTERVAL_MINUTES", 60)) * time.Minute
	maxAge := time.Duration(envInt("RATE_LIMIT_MAX_AGE_HOURS", 24)) * time.Hour
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for range ticker.C {
			if err := store.Cleanup(context.Background(), maxAge); err != nil {
				slog.Warn("rate limiter cleanup failed", "error", err)
			}
		}
	}()
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func envInt(key string, fallback int) int {
	n, err := strconv.Atoi(os.Getenv(key))
	if err != nil || n <= 0 {
		return fallback
	}
	return n
}

// --- noop stores for dev mode (DATABASE_URL unset) ---

type noopSessionAuthStore struct{}

func (noopSessionAuthStore) RefreshSession(_ context.Context, _ string) (httpx.Session, error) {
	return httpx.Session{}, nil
}

type noopUserStore struct{}

func (noopUserStore) CreateUser(_ context.Context, _, _, _, _ string) (int, error) { return 0, nil }
func (noopUserStore) GetUser(_ context.Context, _ string) (users.User, bool, error) {
	return users.User{}, false, nil
}
func (noopUserStore) GetUserWithID(_ context.Context, _ string) (users.UserCredentials, bool, error) {
	return users.UserCredentials{}, false, nil
}
func (noopUserStore) UpdateUser(_ context.Context, _, _, _, _, _ string, _ *string) (users.UpdateUserResult, error) {
	return users.UpdateUserResult{}, nil
}
func (noopUserStore) UpdatePassword(_ context.Context, _, _ string) error      { return nil }
func (noopUserStore) DeleteOtherSessions(_ context.Context, _, _ string) error { return nil }

type noopSessionStore struct{}

func (noopSessionStore) DeleteExpiredSessions(_ context.Context) error      { return nil }
func (noopSessionStore) DeleteExpiredLoginFailures(_ context.Context) error { return nil }
func (noopSessionStore) GetLoginFailures(_ context.Context, _ []string) ([]sessions.LoginFailure, error) {
	return nil, nil
}
func (noopSessionStore) RecordLoginFailure(_ context.Context, _ string, _ time.Time) error {
	return nil
}
func (noopSessionStore) ClearLoginFailures(_ context.Context, _ []string) error { return nil }
func (noopSessionStore) GetUserWithEmail(_ context.Context, _ string) (sessions.UserCredentials, bool, error) {
	return sessions.UserCredentials{}, false, nil
}
func (noopSessionStore) CreateSession(_ context.Context, _ string, _ int, _ time.Time) (sessions.CreatedSession, error) {
	return sessions.CreatedSession{}, nil
}
func (noopSessionStore) DeleteSession(_ context.Context, _ string) error { return nil }

type noopUploadStore struct{}

func (noopUploadStore) DeleteExpiredUploads(_ context.Context) ([]string, error) { return nil, nil }
func (noopUploadStore) HasPendingUploadCapacity(_ context.Context, _ string) (bool, error) {
	return false, nil
}
func (noopUploadStore) CreateUpload(_ context.Context, _, _ string) error { return nil }

type noopPostStore struct{}

func (noopPostStore) CreatePost(_ context.Context, _, _ string, _ *string) (int, bool, error) {
	return 0, false, nil
}
func (noopPostStore) GetFeed(_ context.Context, _, _ int, _ string) ([]posts.Post, error) {
	return nil, nil
}
func (noopPostStore) GetPosts(_ context.Context, _ string, _, _ int, _ string) ([]posts.Post, error) {
	return nil, nil
}
func (noopPostStore) GetLikedPosts(_ context.Context, _ string, _, _ int, _ string) ([]posts.Post, error) {
	return nil, nil
}
func (noopPostStore) GetPost(_ context.Context, _, _ string) (posts.Post, bool, error) {
	return posts.Post{}, false, nil
}
func (noopPostStore) DeletePost(_ context.Context, _, _ string) (string, bool, error) {
	return "", false, nil
}
func (noopPostStore) PostExists(_ context.Context, _ string) (bool, error) { return false, nil }
func (noopPostStore) LikePost(_ context.Context, _, _ string) error        { return nil }
func (noopPostStore) UnlikePost(_ context.Context, _, _ string) error      { return nil }

type noopCommentStore struct{}

func (noopCommentStore) CreateComment(_ context.Context, _, _, _ string) (comments.Comment, error) {
	return comments.Comment{}, nil
}
func (noopCommentStore) ListComments(_ context.Context, _ string, _, _ int) ([]comments.Comment, error) {
	return nil, nil
}
func (noopCommentStore) DeleteComment(_ context.Context, _, _, _ string) (bool, error) {
	return false, nil
}
