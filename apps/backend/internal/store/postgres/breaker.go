package postgres

import (
	"errors"
	"log/slog"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type circuitBreaker struct {
	name              string
	failureThreshold  int
	cooldown          time.Duration
	consecutiveErrors int
	state             string
	openedAt          time.Time
	mu                sync.Mutex
}

func newCircuitBreaker(name string) *circuitBreaker {
	return &circuitBreaker{
		name:             name,
		failureThreshold: envInt("CIRCUIT_FAILURE_THRESHOLD", 5),
		cooldown:         time.Duration(envInt("CIRCUIT_COOLDOWN_SECONDS", 30)) * time.Second,
		state:            "closed",
	}
}

func (b *circuitBreaker) allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.state != "open" {
		return true
	}
	if time.Since(b.openedAt) >= b.cooldown {
		b.state = "half_open"
		slog.Warn("circuit state changed", "downstream", b.name, "state", b.state)
		return true
	}
	return false
}

func (b *circuitBreaker) success() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.consecutiveErrors = 0
	if b.state != "closed" {
		b.state = "closed"
		slog.Info("circuit state changed", "downstream", b.name, "state", b.state)
	}
}

func (b *circuitBreaker) failure(err error) {
	if !isTransientPostgresError(err) {
		return
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	b.consecutiveErrors++
	if b.state == "half_open" || b.consecutiveErrors >= b.failureThreshold {
		b.state = "open"
		b.openedAt = time.Now()
		slog.Warn("circuit state changed", "downstream", b.name, "state", b.state)
	}
}

func isTransientPostgresError(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, pgx.ErrNoRows) {
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
