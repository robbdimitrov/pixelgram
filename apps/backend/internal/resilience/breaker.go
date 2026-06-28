package resilience

import (
	"log/slog"
	"sync"
	"time"
)

type CircuitBreaker struct {
	name              string
	failureThreshold  int
	cooldown          time.Duration
	consecutiveErrors int
	state             string
	openedAt          time.Time
	isFailure         func(error) bool
	now               func() time.Time
	mu                sync.Mutex
}

type CircuitBreakerConfig struct {
	Name             string
	FailureThreshold int
	Cooldown         time.Duration
	IsFailure        func(error) bool
}

func NewCircuitBreaker(cfg CircuitBreakerConfig) *CircuitBreaker {
	isFailure := cfg.IsFailure
	if isFailure == nil {
		isFailure = func(err error) bool { return err != nil }
	}
	if cfg.FailureThreshold <= 0 {
		cfg.FailureThreshold = 1
	}
	return &CircuitBreaker{
		name:             cfg.Name,
		failureThreshold: cfg.FailureThreshold,
		cooldown:         cfg.Cooldown,
		state:            "closed",
		isFailure:        isFailure,
		now:              time.Now,
	}
}

func (b *CircuitBreaker) Allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.state != "open" {
		return true
	}
	if b.now().Sub(b.openedAt) >= b.cooldown {
		b.state = "half_open"
		slog.Warn("circuit state changed", "downstream", b.name, "state", b.state)
		return true
	}
	return false
}

func (b *CircuitBreaker) Success() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.consecutiveErrors = 0
	if b.state != "closed" {
		b.state = "closed"
		slog.Info("circuit state changed", "downstream", b.name, "state", b.state)
	}
}

func (b *CircuitBreaker) Failure(err error) {
	if !b.isFailure(err) {
		return
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	b.consecutiveErrors++
	if b.state == "half_open" || b.consecutiveErrors >= b.failureThreshold {
		b.state = "open"
		b.openedAt = b.now()
		slog.Warn("circuit state changed", "downstream", b.name, "state", b.state)
	}
}
