package database

import (
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"phasma/backend/internal/env"
	"phasma/backend/internal/resilience"
	"phasma/backend/internal/store"
)

func newCircuitBreaker() *resilience.CircuitBreaker {
	return resilience.NewCircuitBreaker(resilience.CircuitBreakerConfig{
		Name:             "database",
		FailureThreshold: env.Int("CIRCUIT_FAILURE_THRESHOLD", 5),
		Cooldown:         time.Duration(env.Int("CIRCUIT_COOLDOWN_SECONDS", 30)) * time.Second,
		IsFailure:        isTransientDatabaseError,
	})
}

func defaultRetryConfig() resilience.RetryConfig {
	return resilience.RetryConfig{
		MaxAttempts: env.Int("POSTGRES_RETRY_MAX_ATTEMPTS", 3),
		BaseBackoff: time.Duration(env.Int("POSTGRES_RETRY_BACKOFF_MS", 100)) * time.Millisecond,
		IsRetryable: isTransientDatabaseError,
	}
}

func isTransientDatabaseError(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, pgx.ErrNoRows) ||
		errors.Is(err, store.ErrNotFound) ||
		errors.Is(err, store.ErrForbidden) ||
		errors.Is(err, store.ErrConflict) {
		return false
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "40001", // serialization_failure
			"40P01", // deadlock_detected
			"57P01", // admin_shutdown
			"57P02": // crash_shutdown
			return true
		}
		return false
	}
	return true
}
