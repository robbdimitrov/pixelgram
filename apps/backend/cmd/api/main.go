package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"pixelgram/backend/internal/app"
	"pixelgram/backend/internal/blobstore"
	"pixelgram/backend/internal/env"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/noop"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/store/postgres"
)

func main() {
	setupLogger()

	port := env.String("PORT", "8080")
	databaseURL := os.Getenv("DATABASE_URL")

	repositories, closeRepositories, err := openRepositories(databaseURL)
	if err != nil {
		slog.Error("failed to initialize repositories", "error", err)
		os.Exit(1)
	}
	defer closeRepositories()

	blobs, err := openBlobStore(context.Background(), databaseURL)
	if err != nil {
		slog.Error("failed to initialize blob store", "error", err)
		os.Exit(1)
	}

	rateLimiter, err := openRateLimiter(databaseURL)
	if err != nil {
		slog.Error("failed to initialize rate limiter", "error", err)
		os.Exit(1)
	}
	startRateLimiterCleanup(rateLimiter)

	signalContext, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	sessionCleanupDone := startSessionCleanup(signalContext, repositories.Sessions)

	handler := app.New(app.Config{
		Blobs:       blobs,
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

	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			slog.Error("backend stopped", "error", err)
			os.Exit(1)
		}
	case <-signalContext.Done():
		slog.Info("stopping backend")
	}
	stop()

	shutdownContext, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownContext); err != nil {
		slog.Error("failed to stop backend", "error", err)
		os.Exit(1)
	}
	<-sessionCleanupDone
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
			Search:      noop.Search{},
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
		Search:      postgres.NewSearchRepository(client),
	}, client.Close, nil
}

func openBlobStore(ctx context.Context, databaseURL string) (blobstore.Store, error) {
	if databaseURL == "" {
		return blobstore.NewMemoryStore(), nil
	}
	return blobstore.NewS3Store(
		ctx,
		env.String("S3_ENDPOINT", "http://seaweedfs:8333"),
		env.String("S3_BUCKET", "pixelgram"),
		env.String("S3_REGION", "us-east-1"),
		os.Getenv("S3_ACCESS_KEY"),
		os.Getenv("S3_SECRET_KEY"),
	)
}

func openRateLimiter(databaseURL string) (httpx.RateLimiterStore, error) {
	if databaseURL == "" {
		return httpx.NoopRateLimiterStore{}, nil
	}
	return httpx.NewPostgresRateLimiterStore(databaseURL)
}

func startRateLimiterCleanup(store httpx.RateLimiterStore) {
	interval := time.Duration(env.Int("RATE_LIMIT_CLEANUP_INTERVAL_MINUTES", 60)) * time.Minute
	maxAge := time.Duration(env.Int("RATE_LIMIT_MAX_AGE_HOURS", 24)) * time.Hour
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

type sessionSweeper interface {
	DeleteExpiredSessions(ctx context.Context) error
}

func startSessionCleanup(ctx context.Context, repository sessions.Repository) <-chan struct{} {
	ticker := time.NewTicker(time.Hour)
	return runSessionCleanup(ctx, repository, ticker.C, ticker.Stop)
}

func runSessionCleanup(
	ctx context.Context,
	repository sessionSweeper,
	ticks <-chan time.Time,
	stopTicker func(),
) <-chan struct{} {
	done := make(chan struct{})
	go func() {
		defer close(done)
		if stopTicker != nil {
			defer stopTicker()
		}

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticks:
				sweepExpiredSessions(ctx, repository)
			}
		}
	}()
	return done
}

func sweepExpiredSessions(ctx context.Context, repository sessionSweeper) {
	defer func() {
		if recovered := recover(); recovered != nil {
			slog.Error("session cleanup panicked", "panic", recovered)
		}
	}()
	if err := repository.DeleteExpiredSessions(ctx); err != nil {
		slog.Warn("session cleanup failed", "error", err)
	}
}
