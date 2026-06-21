package main

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"
)

func TestOpenRepositoriesWithoutDatabaseUsesNoopAdapters(t *testing.T) {
	repositories, readiness, closeRepositories, err := openRepositories("")
	if err != nil {
		t.Fatalf("openRepositories() error = %v", err)
	}
	closeRepositories()
	if repositories.SessionAuth == nil || repositories.Users == nil ||
		repositories.Sessions == nil || repositories.Uploads == nil ||
		repositories.Posts == nil || repositories.Comments == nil ||
		repositories.Search == nil || readiness == nil {
		t.Fatal("openRepositories() returned nil no-op adapter")
	}
	if err := readiness(context.Background()); err != nil {
		t.Fatalf("no-op readiness error = %v", err)
	}
}

func TestOpenRepositoriesRequiresSessionSecretWithDatabase(t *testing.T) {
	t.Setenv("SESSION_HASH_SECRET", "")

	_, _, _, err := openRepositories("postgres://unused")

	if err == nil || !strings.Contains(err.Error(), "SESSION_HASH_SECRET is required") {
		t.Fatalf("openRepositories() error = %v", err)
	}
}

type fakeSessionSweeper struct {
	calls      chan context.Context
	err        error
	panicCount int
}

func (s *fakeSessionSweeper) DeleteExpiredSessions(ctx context.Context) error {
	if s.panicCount > 0 {
		s.panicCount--
		panic("cleanup panic")
	}
	s.calls <- ctx
	return s.err
}

func TestRunSessionCleanupSweepsOnTicksUntilCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	ticks := make(chan time.Time)
	sweeper := &fakeSessionSweeper{
		calls: make(chan context.Context, 2),
		err:   errors.New("database unavailable"),
	}
	done := runSessionCleanup(ctx, sweeper, ticks, nil)

	ticks <- time.Now()
	ticks <- time.Now()
	for i := 0; i < 2; i++ {
		select {
		case callContext := <-sweeper.calls:
			if callContext != ctx {
				t.Fatal("cleanup did not receive the process context")
			}
		case <-time.After(time.Second):
			t.Fatal("session cleanup did not run")
		}
	}

	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("session cleanup did not stop after cancellation")
	}
}

func TestRunSessionCleanupRecoversPanic(t *testing.T) {
	ticks := make(chan time.Time)
	stopped := make(chan struct{}, 1)
	sweeper := &fakeSessionSweeper{
		calls:      make(chan context.Context, 1),
		panicCount: 1,
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := runSessionCleanup(ctx, sweeper, ticks, func() { stopped <- struct{}{} })

	ticks <- time.Now()
	ticks <- time.Now()
	select {
	case <-sweeper.calls:
	case <-time.After(time.Second):
		t.Fatal("session cleanup did not continue after recovering a panic")
	}
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("session cleanup did not stop after cancellation")
	}
	select {
	case <-stopped:
	case <-time.After(time.Second):
		t.Fatal("session cleanup did not stop its ticker")
	}
}
