package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"phasma/backend/internal/app"
	"phasma/backend/internal/blobstore"
	"phasma/backend/internal/db"
	"phasma/backend/internal/env"
	"phasma/backend/internal/feed"
	"phasma/backend/internal/httpx"
	"phasma/backend/internal/notifications"
	"phasma/backend/internal/search"
	"phasma/backend/internal/sessions"
	"phasma/backend/internal/store/database"
)

const defaultDatabaseURL = "postgres://postgres:postgres@localhost:5432/phasma?sslmode=disable"

func main() {
	setupLogger()

	port := env.String("PORT", "8080")
	databaseURL := env.String("DATABASE_URL", defaultDatabaseURL)

	repositories, databaseHandle, readiness, closeRepositories, err := openRepositories(databaseURL)
	if err != nil {
		slog.Error("failed to initialize repositories", "error", err)
		os.Exit(1)
	}
	defer closeRepositories()

	blobs, err := openBlobStore(context.Background())
	if err != nil {
		slog.Error("failed to initialize blob store", "error", err)
		os.Exit(1)
	}

	searchClient, err := openSearchClient(context.Background())
	if err != nil {
		slog.Error("failed to initialize search client", "error", err)
		os.Exit(1)
	}

	rateLimiter, err := openRateLimiter()
	if err != nil {
		slog.Error("failed to initialize rate limiter", "error", err)
		os.Exit(1)
	}

	loginThrottle, err := openLoginThrottle()
	if err != nil {
		slog.Error("failed to initialize login throttle", "error", err)
		os.Exit(1)
	}

	signalContext, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	sessionCleanupDone := startSessionCleanup(signalContext, repositories.Sessions)

	var sweepOutboxDone <-chan struct{}
	if databaseHandle != nil {
		ch := make(chan struct{})
		sweepOutboxDone = ch
		go func() {
			defer close(ch)
			sweepOutboxPeriodically(signalContext, databaseHandle)
		}()
	}

	var reconcileFollowersDone <-chan struct{}
	if databaseHandle != nil {
		ch := make(chan struct{})
		reconcileFollowersDone = ch
		go func() {
			defer close(ch)
			reconcileFollowerCountsPeriodically(signalContext, databaseHandle)
		}()
	}

	var consumerWg sync.WaitGroup
	if brokersEnv := os.Getenv("REDPANDA_BROKERS"); brokersEnv != "" {
		brokers := strings.Split(brokersEnv, ",")

		notifConsumer, err := notifications.NewConsumer(brokers, repositories.Notifications)
		if err != nil {
			slog.Error("failed to initialize notifications consumer", "error", err)
			os.Exit(1)
		}
		defer notifConsumer.Close()
		consumerWg.Add(1)
		go func() {
			defer consumerWg.Done()
			notifConsumer.Run(signalContext)
		}()

		feedConsumer, err := feed.NewConsumer(brokers, repositories.Feed)
		if err != nil {
			slog.Error("failed to initialize feed consumer", "error", err)
			os.Exit(1)
		}
		defer feedConsumer.Close()
		consumerWg.Add(1)
		go func() {
			defer consumerWg.Done()
			feedConsumer.Run(signalContext)
		}()
	}

	handler := app.New(app.Config{
		Blobs:         blobs,
		RateLimiter:   rateLimiter,
		LoginThrottle: loginThrottle,
		Readiness:     readiness,
		SearchClient:  searchClient,
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
	if sweepOutboxDone != nil {
		<-sweepOutboxDone
	}
	if reconcileFollowersDone != nil {
		<-reconcileFollowersDone
	}
	consumerWg.Wait()
}

func setupLogger() {
	level := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "debug" {
		level = slog.LevelDebug
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})))
}

func openRepositories(databaseURL string) (app.Repositories, *db.DB, func(context.Context) error, func(), error) {
	sessionSecret := os.Getenv("SESSION_HASH_SECRET")
	if sessionSecret == "" {
		return app.Repositories{}, nil, nil, func() {}, errors.New("SESSION_HASH_SECRET is required")
	}

	client, err := database.New(context.Background(), databaseURL, sessionSecret)
	if err != nil {
		return app.Repositories{}, nil, nil, func() {}, err
	}

	return app.Repositories{
		SessionAuth:   database.NewSessionRepository(client),
		Users:         database.NewUserRepository(client),
		Sessions:      database.NewSessionRepository(client),
		Uploads:       database.NewUploadRepository(client),
		Posts:         database.NewPostRepository(client),
		Comments:      database.NewCommentRepository(client),
		Search:        database.NewSearchRepository(client),
		Feed:          database.NewFeedRepository(client, feed.CelebThreshold),
		Notifications: database.NewNotificationRepository(client),
	}, client.DB(), client.Ping, client.Close, nil
}

func openSearchClient(ctx context.Context) (*search.SearchClient, error) {
	searchURL := env.String("MEILI_URL", "http://search:7700")
	masterKey := os.Getenv("MEILI_MASTER_KEY")
	return search.NewSearchClient(ctx, searchURL, masterKey)
}

func openBlobStore(ctx context.Context) (blobstore.Store, error) {
	return blobstore.NewStorageStore(
		ctx,
		env.String("S3_ENDPOINT", "http://storage:8333"),
		env.String("S3_BUCKET", "phasma"),
		env.String("S3_REGION", "us-east-1"),
		os.Getenv("S3_ACCESS_KEY"),
		os.Getenv("S3_SECRET_KEY"),
	)
}

func openRateLimiter() (httpx.RateLimiterStore, error) {
	cacheURL := os.Getenv("CACHE_URL")
	if cacheURL == "" {
		return httpx.NoopRateLimiterStore{}, nil
	}
	return httpx.NewCacheRateLimiterStore(cacheURL, os.Getenv("CACHE_PASSWORD"))
}

func openLoginThrottle() (sessions.LoginThrottle, error) {
	cacheURL := os.Getenv("CACHE_URL")
	if cacheURL == "" {
		return sessions.NoopLoginThrottle{}, nil
	}
	return sessions.NewCacheLoginThrottle(cacheURL, os.Getenv("CACHE_PASSWORD"))
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

func sweepOutboxPeriodically(ctx context.Context, db *db.DB) {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			sweepExpiredOutbox(ctx, db)
		}
	}
}

func sweepExpiredOutbox(ctx context.Context, db *db.DB) {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("outbox cleanup panicked", "panic", r)
		}
	}()
	conn, err := db.Pool().Acquire(ctx)
	if err != nil {
		slog.Warn("outbox cleanup: acquire connection failed", "error", err)
		return
	}
	defer conn.Release()
	var acquired bool
	if err := conn.QueryRow(ctx, `SELECT pg_try_advisory_lock(1)`).Scan(&acquired); err != nil || !acquired {
		return
	}
	defer conn.Exec(context.Background(), `SELECT pg_advisory_unlock(1)`)
	if _, err := conn.Exec(ctx,
		"DELETE FROM outbox WHERE published_at IS NOT NULL AND created < now() - interval '7 days'"); err != nil {
		slog.Warn("outbox cleanup failed", "error", err)
	}
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

func reconcileFollowerCountsPeriodically(ctx context.Context, db *db.DB) {
	reconcileFollowerCounts(ctx, db)
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			reconcileFollowerCounts(ctx, db)
		}
	}
}

func reconcileFollowerCounts(ctx context.Context, db *db.DB) {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("follower count reconciliation panicked", "panic", r)
		}
	}()
	conn, err := db.Pool().Acquire(ctx)
	if err != nil {
		slog.Warn("follower count reconciliation: acquire connection failed", "error", err)
		return
	}
	defer conn.Release()
	var acquired bool
	if err := conn.QueryRow(ctx, `SELECT pg_try_advisory_lock(2)`).Scan(&acquired); err != nil || !acquired {
		return
	}
	defer conn.Exec(context.Background(), `SELECT pg_advisory_unlock(2)`)
	if _, err := conn.Exec(ctx,
		`UPDATE users SET
			follower_count = f.cnt,
			is_celebrity   = is_celebrity OR f.cnt > $1
		FROM LATERAL (SELECT count(*)::int AS cnt FROM follows WHERE followee_id = users.id) AS f`,
		feed.CelebThreshold); err != nil {
		slog.Warn("follower count reconciliation failed", "error", err)
	}
}
