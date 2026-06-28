package main

import (
	"context"
	"log/slog"
	"time"

	"phasma/backend/internal/feed"
	"phasma/backend/internal/sessions"
	"phasma/backend/internal/store/database"
)

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

func reconcileFollowerCountsPeriodically(ctx context.Context, db *database.DB) {
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

func reconcileFollowerCounts(ctx context.Context, db *database.DB) {
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
