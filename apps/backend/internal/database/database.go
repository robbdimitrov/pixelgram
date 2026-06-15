package database

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"pixelgram/backend/internal/auth"
	"pixelgram/backend/internal/store"
)

type DB struct {
	pool          *pgxpool.Pool
	sessionSecret string
	breaker       *circuitBreaker
	retryCfg      retryConfig
}

func Open(ctx context.Context, databaseURL, sessionSecret string) (*DB, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	config.MaxConns = 10

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return &DB{
		pool:          pool,
		sessionSecret: sessionSecret,
		breaker:       newCircuitBreaker("postgres"),
		retryCfg:      defaultRetryConfig(),
	}, nil
}

func (db *DB) Close() {
	db.pool.Close()
}

func (db *DB) Pool() *pgxpool.Pool {
	return db.pool
}

func (db *DB) Allow() error {
	if !db.breaker.allow() {
		return store.ErrUnavailable
	}
	return nil
}

func (db *DB) Success() {
	db.breaker.success()
}

func (db *DB) Failure(err error) {
	db.breaker.failure(err)
}

func (db *DB) Retry(ctx context.Context, fn func() error) error {
	return withRetry(ctx, db.retryCfg, fn)
}

func (db *DB) HashSession(sessionID string) string {
	return auth.HashSessionToken(sessionID, db.sessionSecret)
}

func UniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func NullableString(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func Rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}
