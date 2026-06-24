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
	"phasma/backend/internal/database"
	"phasma/backend/internal/env"
	"phasma/backend/internal/feed"
	"phasma/backend/internal/httpx"
	"phasma/backend/internal/noop"
	"phasma/backend/internal/notifications"
	"phasma/backend/internal/search"
	"phasma/backend/internal/sessions"
	"phasma/backend/internal/store/postgres"
)

func main() {
	setupLogger()

	port := env.String("PORT", "8080")
	databaseURL := os.Getenv("DATABASE_URL")

	repositories, db, readiness, closeRepositories, err := openRepositories(databaseURL)
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

	meili, err := openMeiliClient(context.Background(), databaseURL)
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
	if db != nil {
		ch := make(chan struct{})
		sweepOutboxDone = ch
		go func() {
			defer close(ch)
			sweepOutboxPeriodically(signalContext, db)
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
		Meili:         meili,
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
	consumerWg.Wait()
}

func setupLogger() {
	level := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "debug" {
		level = slog.LevelDebug
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})))
}

func openRepositories(databaseURL string) (app.Repositories, *database.DB, func(context.Context) error, func(), error) {
	if databaseURL == "" {
		return app.Repositories{
			SessionAuth:   noop.SessionAuth{},
			Users:         noop.Users{},
			Sessions:      noop.Sessions{},
			Uploads:       noop.Uploads{},
			Posts:         noop.Posts{},
			Comments:      noop.Comments{},
			Search:        noop.Search{},
			Feed:          noop.Feed{},
			Notifications: noop.Notifications{},
		}, nil, func(context.Context) error { return nil }, func() {}, nil
	}

	sessionSecret := os.Getenv("SESSION_HASH_SECRET")
	if sessionSecret == "" {
		return app.Repositories{}, nil, nil, func() {}, errors.New("SESSION_HASH_SECRET is required when DATABASE_URL is set")
	}

	client, err := postgres.New(context.Background(), databaseURL, sessionSecret)
	if err != nil {
		return app.Repositories{}, nil, nil, func() {}, err
	}

	return app.Repositories{
		SessionAuth:   postgres.NewSessionRepository(client),
		Users:         postgres.NewUserRepository(client),
		Sessions:      postgres.NewSessionRepository(client),
		Uploads:       postgres.NewUploadRepository(client),
		Posts:         postgres.NewPostRepository(client),
		Comments:      postgres.NewCommentRepository(client),
		Search:        postgres.NewSearchRepository(client),
		Feed:          postgres.NewFeedRepository(client, feed.CelebThreshold),
		Notifications: postgres.NewNotificationRepository(client),
	}, client.DB(), client.Ping, client.Close, nil
}

func openMeiliClient(ctx context.Context, databaseURL string) (*search.MeiliClient, error) {
	if databaseURL == "" {
		return nil, nil
	}
	meiliURL := env.String("MEILI_URL", "http://search:7700")
	masterKey := os.Getenv("MEILI_MASTER_KEY")
	return search.NewMeiliClient(ctx, meiliURL, masterKey)
}

func openBlobStore(ctx context.Context, databaseURL string) (blobstore.Store, error) {
	if databaseURL == "" {
		return blobstore.NewMemoryStore(), nil
	}
	return blobstore.NewS3Store(
		ctx,
		env.String("S3_ENDPOINT", "http://storage:8333"),
		env.String("S3_BUCKET", "phasma"),
		env.String("S3_REGION", "us-east-1"),
		os.Getenv("S3_ACCESS_KEY"),
		os.Getenv("S3_SECRET_KEY"),
	)
}

func openRateLimiter() (httpx.RateLimiterStore, error) {
	dragonflyURL := os.Getenv("DRAGONFLY_URL")
	if dragonflyURL == "" {
		return httpx.NoopRateLimiterStore{}, nil
	}
	return httpx.NewDragonflyRateLimiterStore(dragonflyURL, os.Getenv("DRAGONFLY_PASSWORD"))
}

func openLoginThrottle() (sessions.LoginThrottle, error) {
	dragonflyURL := os.Getenv("DRAGONFLY_URL")
	if dragonflyURL == "" {
		return sessions.NoopLoginThrottle{}, nil
	}
	return sessions.NewDragonflyLoginThrottle(dragonflyURL, os.Getenv("DRAGONFLY_PASSWORD"))
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

func sweepOutboxPeriodically(ctx context.Context, db *database.DB) {
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

func sweepExpiredOutbox(ctx context.Context, db *database.DB) {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("outbox cleanup panicked", "panic", r)
		}
	}()
	if _, err := db.Pool().Exec(ctx, "DELETE FROM outbox WHERE created < now() - interval '7 days'"); err != nil {
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
