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

	"pixelgram/backend/internal/app"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/noop"
	"pixelgram/backend/internal/store/postgres"
)

func main() {
	setupLogger()

	port := getenv("PORT", "8080")
	databaseURL := os.Getenv("DATABASE_URL")

	repositories, closeRepositories, err := openRepositories(databaseURL)
	if err != nil {
		slog.Error("failed to initialize repositories", "error", err)
		os.Exit(1)
	}
	defer closeRepositories()

	rateLimiter := openRateLimiter(databaseURL)
	startRateLimiterCleanup(rateLimiter)

	handler := app.New(app.Config{
		ImageDir:    getenv("IMAGE_DIR", "/tmp"),
		RateLimiter: rateLimiter,
	}, repositories)

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

func openRepositories(databaseURL string) (app.Repositories, func(), error) {
	if databaseURL == "" {
		return app.Repositories{
			SessionAuth: noop.SessionAuth{},
			Users:       noop.Users{},
			Sessions:    noop.Sessions{},
			Uploads:     noop.Uploads{},
			Posts:       noop.Posts{},
			Comments:    noop.Comments{},
		}, func() {}, nil
	}

	sessionSecret := os.Getenv("SESSION_HASH_SECRET")
	if sessionSecret == "" {
		return app.Repositories{}, func() {}, errors.New("SESSION_HASH_SECRET is required when DATABASE_URL is set")
	}

	client, err := postgres.New(context.Background(), databaseURL, sessionSecret)
	if err != nil {
		return app.Repositories{}, func() {}, err
	}

	return app.Repositories{
		SessionAuth: postgres.NewSessionRepository(client),
		Users:       postgres.NewUserRepository(client),
		Sessions:    postgres.NewSessionRepository(client),
		Uploads:     postgres.NewUploadRepository(client),
		Posts:       postgres.NewPostRepository(client),
		Comments:    postgres.NewCommentRepository(client),
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
