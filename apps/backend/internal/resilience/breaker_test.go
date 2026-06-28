package resilience

import (
	"errors"
	"testing"
	"time"
)

func TestCircuitBreakerOpensAfterConfiguredFailures(t *testing.T) {
	breaker := NewCircuitBreaker(CircuitBreakerConfig{
		Name:             "test",
		FailureThreshold: 2,
		Cooldown:         time.Second,
	})
	if !breaker.Allow() {
		t.Fatal("new breaker should allow calls")
	}

	breaker.Failure(errors.New("down"))
	if !breaker.Allow() {
		t.Fatal("breaker opened before threshold")
	}

	breaker.Failure(errors.New("still down"))
	if breaker.Allow() {
		t.Fatal("breaker should reject calls after threshold")
	}
}

func TestCircuitBreakerIgnoresNonFailureErrors(t *testing.T) {
	ignored := errors.New("ignored")
	breaker := NewCircuitBreaker(CircuitBreakerConfig{
		Name:             "test",
		FailureThreshold: 1,
		Cooldown:         time.Second,
		IsFailure: func(err error) bool {
			return !errors.Is(err, ignored)
		},
	})

	breaker.Failure(ignored)
	if !breaker.Allow() {
		t.Fatal("breaker should ignore configured non-failure errors")
	}
}

func TestCircuitBreakerHalfOpenAfterCooldown(t *testing.T) {
	now := time.Date(2026, 6, 28, 12, 0, 0, 0, time.UTC)
	breaker := NewCircuitBreaker(CircuitBreakerConfig{
		Name:             "test",
		FailureThreshold: 1,
		Cooldown:         time.Second,
	})
	breaker.now = func() time.Time { return now }

	breaker.Failure(errors.New("down"))
	now = now.Add(time.Second)
	if !breaker.Allow() {
		t.Fatal("breaker should allow a half-open probe after cooldown")
	}

	breaker.Success()
	if !breaker.Allow() {
		t.Fatal("breaker should close after a successful probe")
	}
}
