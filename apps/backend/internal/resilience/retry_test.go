package resilience

import (
	"context"
	"errors"
	"testing"
)

func TestWithRetryRetriesRetryableErrors(t *testing.T) {
	transient := errors.New("transient")
	attempts := 0

	err := WithRetry(context.Background(), RetryConfig{
		MaxAttempts: 3,
		IsRetryable: func(err error) bool {
			return errors.Is(err, transient)
		},
	}, "test", func() error {
		attempts++
		if attempts < 3 {
			return transient
		}
		return nil
	})
	if err != nil {
		t.Fatalf("WithRetry() error = %v", err)
	}
	if attempts != 3 {
		t.Fatalf("attempts = %d, want 3", attempts)
	}
}

func TestWithRetryStopsOnNonRetryableError(t *testing.T) {
	permanent := errors.New("permanent")
	attempts := 0

	err := WithRetry(context.Background(), RetryConfig{
		MaxAttempts: 3,
		IsRetryable: func(error) bool {
			return false
		},
	}, "test", func() error {
		attempts++
		return permanent
	})
	if !errors.Is(err, permanent) {
		t.Fatalf("WithRetry() error = %v, want %v", err, permanent)
	}
	if attempts != 1 {
		t.Fatalf("attempts = %d, want 1", attempts)
	}
}

func TestWithRetryHonorsContextCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := WithRetry(ctx, RetryConfig{
		MaxAttempts: 2,
		IsRetryable: func(error) bool {
			return true
		},
	}, "test", func() error {
		return errors.New("transient")
	})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("WithRetry() error = %v, want %v", err, context.Canceled)
	}
}
