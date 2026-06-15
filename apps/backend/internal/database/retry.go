package database

import (
	"context"
	"log/slog"
	"os"
	"strconv"
	"time"
)

type retryConfig struct {
	maxAttempts int
	baseBackoff time.Duration
}

func defaultRetryConfig() retryConfig {
	return retryConfig{
		maxAttempts: envInt("POSTGRES_RETRY_MAX_ATTEMPTS", 3),
		baseBackoff: time.Duration(envInt("POSTGRES_RETRY_BACKOFF_MS", 100)) * time.Millisecond,
	}
}

func withRetry(ctx context.Context, cfg retryConfig, fn func() error) error {
	var err error
	for attempt := 1; attempt <= cfg.maxAttempts; attempt++ {
		err = fn()
		if err == nil {
			return nil
		}
		if !isTransientPostgresError(err) || attempt == cfg.maxAttempts {
			return err
		}
		slog.Warn("retrying postgres operation", "attempt", attempt, "error", err)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(time.Duration(attempt) * cfg.baseBackoff):
		}
	}
	return err
}

func envInt(key string, fallback int) int {
	value, err := strconv.Atoi(os.Getenv(key))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}
