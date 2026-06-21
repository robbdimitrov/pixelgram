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
	"pixelgram/backend/internal/blobstore"
	"pixelgram/backend/internal/database"
	"pixelgram/backend/internal/env"
	"pixelgram/backend/internal/httpx"
	"pixelgram/backend/internal/noop"
	"pixelgram/backend/internal/search"
	"pixelgram/backend/internal/sessions"
	"pixelgram/backend/internal/store/postgres"
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

	if meili != nil && db != nil {
		worker := search.NewWorker(db, meili)
		go worker.Run(signalContext)
		go runBackfill(signalContext, db, meili)
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
			SessionAuth: noop.SessionAuth{},
			Users:       noop.Users{},
			Sessions:    noop.Sessions{},
			Uploads:     noop.Uploads{},
			Posts:       noop.Posts{},
			Comments:    noop.Comments{},
			Search:      noop.Search{},
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
		SessionAuth: postgres.NewSessionRepository(client),
		Users:       postgres.NewUserRepository(client),
		Sessions:    postgres.NewSessionRepository(client),
		Uploads:     postgres.NewUploadRepository(client),
		Posts:       postgres.NewPostRepository(client),
		Comments:    postgres.NewCommentRepository(client),
		Search:      postgres.NewSearchRepository(client),
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

// backfillAdvisoryLock is the Postgres advisory lock ID used to ensure only
// one replica runs the initial backfill at startup.
const backfillAdvisoryLock = 774191

// runBackfill streams all users, posts, and hashtags into Meilisearch once.
// An advisory lock ensures only one replica performs the backfill concurrently.
func runBackfill(ctx context.Context, db *database.DB, meili *search.MeiliClient) {
	defer func() {
		if recovered := recover(); recovered != nil {
			slog.Error("search backfill panicked", "panic", recovered)
		}
	}()

	conn, err := db.Pool().Acquire(ctx)
	if err != nil {
		return
	}
	defer conn.Release()

	var locked bool
	if err := conn.QueryRow(ctx, "SELECT pg_try_advisory_lock($1)", backfillAdvisoryLock).Scan(&locked); err != nil || !locked {
		return
	}
	defer conn.Exec(ctx, "SELECT pg_advisory_unlock($1)", backfillAdvisoryLock) //nolint:errcheck

	backfillUsers(ctx, db, meili)
	backfillPosts(ctx, db, meili)
	backfillHashtags(ctx, db, meili)
}

const backfillBatchSize = 500

func backfillUsers(ctx context.Context, db *database.DB, meili *search.MeiliClient) {
	var lastID int
	for {
		var docs []map[string]any
		err := db.Read(ctx, func() error {
			rows, err := db.Pool().Query(ctx,
				`SELECT id, username, name FROM users WHERE id > $1 ORDER BY id LIMIT $2`,
				lastID, backfillBatchSize)
			if err != nil {
				return err
			}
			defer rows.Close()
			docs = docs[:0]
			for rows.Next() {
				var id int
				var username, name string
				if err := rows.Scan(&id, &username, &name); err != nil {
					return err
				}
				lastID = id
				docs = append(docs, map[string]any{
					"id":       strconv.Itoa(id),
					"username": username,
					"name":     name,
				})
			}
			return rows.Err()
		})
		if err != nil || len(docs) == 0 {
			return
		}
		if err := meili.UpsertDocuments(ctx, "users", docs); err != nil {
			slog.Warn("search backfill: upsert users failed", "error", err)
			return
		}
		if len(docs) < backfillBatchSize {
			return
		}
	}
}

func backfillPosts(ctx context.Context, db *database.DB, meili *search.MeiliClient) {
	var lastID int
	for {
		type postRow struct {
			id          int
			publicID    string
			username    string
			description *string
			created     int64
		}
		var batch []postRow
		err := db.Read(ctx, func() error {
			rows, err := db.Pool().Query(ctx,
				`SELECT p.id, p.public_id, u.username, p.description,
				extract(epoch from p.created)::bigint
				FROM posts p JOIN users u ON u.id = p.user_id
				WHERE p.id > $1 ORDER BY p.id LIMIT $2`,
				lastID, backfillBatchSize)
			if err != nil {
				return err
			}
			defer rows.Close()
			batch = batch[:0]
			for rows.Next() {
				var r postRow
				var desc *string
				if err := rows.Scan(&r.id, &r.publicID, &r.username, &desc, &r.created); err != nil {
					return err
				}
				r.description = desc
				lastID = r.id
				batch = append(batch, r)
			}
			return rows.Err()
		})
		if err != nil || len(batch) == 0 {
			return
		}
		docs := make([]map[string]any, 0, len(batch))
		for _, r := range batch {
			var hashtags []string
			_ = db.Read(ctx, func() error {
				rows, err := db.Pool().Query(ctx,
					`SELECT h.name FROM hashtags h
					JOIN post_hashtags ph ON ph.hashtag_id = h.id
					WHERE ph.post_id = $1`, r.id)
				if err != nil {
					return err
				}
				defer rows.Close()
				for rows.Next() {
					var tag string
					if err := rows.Scan(&tag); err != nil {
						return err
					}
					hashtags = append(hashtags, tag)
				}
				return rows.Err()
			})
			docs = append(docs, map[string]any{
				"id":          r.publicID,
				"description": r.description,
				"username":    r.username,
				"hashtags":    hashtags,
				"created":     r.created,
			})
		}
		if err := meili.UpsertDocuments(ctx, "posts", docs); err != nil {
			slog.Warn("search backfill: upsert posts failed", "error", err)
			return
		}
		if len(batch) < backfillBatchSize {
			return
		}
	}
}

func backfillHashtags(ctx context.Context, db *database.DB, meili *search.MeiliClient) {
	var lastName string
	for {
		var docs []map[string]any
		err := db.Read(ctx, func() error {
			rows, err := db.Pool().Query(ctx,
				`SELECT h.name, count(ph.post_id) AS post_count
				FROM hashtags h LEFT JOIN post_hashtags ph ON ph.hashtag_id = h.id
				WHERE h.name > $1
				GROUP BY h.name ORDER BY h.name LIMIT $2`,
				lastName, backfillBatchSize)
			if err != nil {
				return err
			}
			defer rows.Close()
			docs = docs[:0]
			for rows.Next() {
				var name string
				var postCount int
				if err := rows.Scan(&name, &postCount); err != nil {
					return err
				}
				lastName = name
				docs = append(docs, map[string]any{
					"id":         name,
					"name":       name,
					"post_count": postCount,
				})
			}
			return rows.Err()
		})
		if err != nil || len(docs) == 0 {
			return
		}
		if err := meili.UpsertDocuments(ctx, "hashtags", docs); err != nil {
			slog.Warn("search backfill: upsert hashtags failed", "error", err)
			return
		}
		if len(docs) < backfillBatchSize {
			return
		}
	}
}

func openBlobStore(ctx context.Context, databaseURL string) (blobstore.Store, error) {
	if databaseURL == "" {
		return blobstore.NewMemoryStore(), nil
	}
	return blobstore.NewS3Store(
		ctx,
		env.String("S3_ENDPOINT", "http://storage:8333"),
		env.String("S3_BUCKET", "pixelgram"),
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
