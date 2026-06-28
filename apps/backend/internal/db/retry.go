package db

import (
	"context"
	"log/slog"
	"time"

	"phasma/backend/internal/env"
)

type retryConfig struct {
	maxAttempts int
	baseBackoff time.Duration
}

func defaultRetryConfig() retryConfig {
	return retryConfig{
		maxAttempts: env.Int("POSTGRES_RETRY_MAX_ATTEMPTS", 3),
		baseBackoff: time.Duration(env.Int("POSTGRES_RETRY_BACKOFF_MS", 100)) * time.Millisecond,
	}
}

func withRetry(ctx context.Context, cfg retryConfig, fn func() error) error {
	var err error
	for attempt := 1; attempt <= cfg.maxAttempts; attempt++ {
		err = fn()
		if err == nil {
			return nil
		}
		if !isTransientDatabaseError(err) || attempt == cfg.maxAttempts {
			return err
		}
		slog.Warn("retrying database operation", "attempt", attempt, "error", err)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(time.Duration(attempt) * cfg.baseBackoff):
		}
	}
	return err
}
