package resilience

import (
	"context"
	"log/slog"
	"time"
)

type RetryConfig struct {
	MaxAttempts int
	BaseBackoff time.Duration
	IsRetryable func(error) bool
}

func WithRetry(ctx context.Context, cfg RetryConfig, operation string, fn func() error) error {
	isRetryable := cfg.IsRetryable
	if isRetryable == nil {
		isRetryable = func(err error) bool { return err != nil }
	}
	if cfg.MaxAttempts <= 0 {
		cfg.MaxAttempts = 1
	}
	var err error
	for attempt := 1; attempt <= cfg.MaxAttempts; attempt++ {
		err = fn()
		if err == nil {
			return nil
		}
		if !isRetryable(err) || attempt == cfg.MaxAttempts {
			return err
		}
		if ctxErr := ctx.Err(); ctxErr != nil {
			return ctxErr
		}
		slog.Warn("retrying operation", "operation", operation, "attempt", attempt, "error", err)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(time.Duration(attempt) * cfg.BaseBackoff):
		}
	}
	return err
}
