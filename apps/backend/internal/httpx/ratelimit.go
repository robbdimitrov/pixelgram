package httpx

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"pixelgram/backend/internal/env"
)

type RateLimitPolicy struct {
	Name  string
	Burst int
	Rate  float64
}

type RateLimitDecision struct {
	Allowed    bool
	RetryAfter time.Duration
}

type RateLimiterStore interface {
	Allow(ctx context.Context, identifier string, policy RateLimitPolicy) (RateLimitDecision, error)
	Cleanup(ctx context.Context, maxAge time.Duration) error
}

type PostgresRateLimiterStore struct {
	db       *pgxpool.Pool
	failOpen bool
}

func NewPostgresRateLimiterStore(databaseURL string) (*PostgresRateLimiterStore, error) {
	failOpen := env.Bool("RATE_LIMIT_FAIL_OPEN", false)
	if databaseURL == "" {
		slog.Warn("database url not set for rate limiter", "fail_open", failOpen)
		return &PostgresRateLimiterStore{failOpen: failOpen}, nil
	}

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("rate limiter: parse database url: %w", err)
	}
	config.MaxConns = 5

	db, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("rate limiter: connect to database: %w", err)
	}

	return &PostgresRateLimiterStore{db: db, failOpen: failOpen}, nil
}

func (s *PostgresRateLimiterStore) Allow(ctx context.Context, identifier string, policy RateLimitPolicy) (RateLimitDecision, error) {
	if s.db == nil {
		return RateLimitDecision{Allowed: s.failOpen}, errors.New("rate limiter storage unavailable")
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return RateLimitDecision{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var tokens int
	var elapsed float64
	err = tx.QueryRow(ctx, `SELECT tokens, EXTRACT(EPOCH FROM now() - last_updated) FROM rate_limits WHERE id = $1 FOR UPDATE`, identifier).Scan(&tokens, &elapsed)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return RateLimitDecision{}, err
		}
		_, err = tx.Exec(ctx, `INSERT INTO rate_limits (id, tokens, last_updated) VALUES ($1, $2, now()) ON CONFLICT (id) DO NOTHING`, identifier, policy.Burst-1)
		if err != nil {
			return RateLimitDecision{}, err
		}
		if err := tx.Commit(ctx); err != nil {
			return RateLimitDecision{}, err
		}
		return RateLimitDecision{Allowed: true}, nil
	}

	newTokens := tokens + int(elapsed*policy.Rate)
	if newTokens > policy.Burst {
		newTokens = policy.Burst
	}

	if newTokens > 0 {
		_, err = tx.Exec(ctx, `UPDATE rate_limits SET tokens = $1, last_updated = now() WHERE id = $2`, newTokens-1, identifier)
		if err != nil {
			return RateLimitDecision{}, err
		}
		if err := tx.Commit(ctx); err != nil {
			return RateLimitDecision{}, err
		}
		return RateLimitDecision{Allowed: true}, nil
	}

	if err := tx.Commit(ctx); err != nil {
		return RateLimitDecision{}, err
	}
	retryAfter := time.Second
	if policy.Rate > 0 {
		retryAfter = time.Duration(float64(time.Second) / policy.Rate)
	}
	return RateLimitDecision{Allowed: false, RetryAfter: retryAfter}, nil
}

func (s *PostgresRateLimiterStore) Cleanup(ctx context.Context, maxAge time.Duration) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(ctx, `DELETE FROM rate_limits WHERE last_updated < now() - ($1 * interval '1 second')`, int64(maxAge.Seconds()))
	return err
}

type NoopRateLimiterStore struct{}

func (NoopRateLimiterStore) Allow(_ context.Context, _ string, _ RateLimitPolicy) (RateLimitDecision, error) {
	return RateLimitDecision{Allowed: true}, nil
}

func (NoopRateLimiterStore) Cleanup(_ context.Context, _ time.Duration) error { return nil }

func RateLimit(store RateLimiterStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			policy, exempt := rateLimitPolicy(r)
			if exempt {
				next.ServeHTTP(w, r)
				return
			}

			decision, err := store.Allow(r.Context(), rateLimitKey(r, policy), policy)
			if err != nil {
				slog.Error("rate limiter storage failed", "request_id", GetRequestID(r), "policy", policy.Name, "error", err)
				if !decision.Allowed {
					WriteMessage(w, http.StatusServiceUnavailable, "Service unavailable")
					return
				}
			}
			if !decision.Allowed {
				w.Header().Set("Retry-After", strconv.Itoa(int(decision.RetryAfter.Seconds()+0.5)))
				WriteMessage(w, http.StatusTooManyRequests, "Too many requests")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func rateLimitPolicy(r *http.Request) (RateLimitPolicy, bool) {
	if r.Method == http.MethodGet && (r.URL.Path == "/health" || r.URL.Path == "/ready") {
		return RateLimitPolicy{}, true
	}
	switch {
	case r.Method == http.MethodPost && (r.URL.Path == "/sessions" || r.URL.Path == "/users" || r.URL.Path == "/uploads"):
		return RateLimitPolicy{Name: "strict", Burst: env.Int("RATE_LIMIT_STRICT_BURST", 5), Rate: env.Float("RATE_LIMIT_STRICT_RATE", 0.2)}, false
	case r.Method == http.MethodGet && (r.URL.Path == "/users/search" || r.URL.Path == "/hashtags/search" || r.URL.Path == "/search"):
		return RateLimitPolicy{Name: "typeahead", Burst: env.Int("RATE_LIMIT_TYPEAHEAD_BURST", 20), Rate: env.Float("RATE_LIMIT_TYPEAHEAD_RATE", 5)}, false
	case r.Method == http.MethodGet || r.Method == http.MethodHead:
		return RateLimitPolicy{Name: "read", Burst: env.Int("RATE_LIMIT_READ_BURST", 120), Rate: env.Float("RATE_LIMIT_READ_RATE", 2)}, false
	default:
		return RateLimitPolicy{Name: "mutation", Burst: env.Int("RATE_LIMIT_MUTATION_BURST", 30), Rate: env.Float("RATE_LIMIT_MUTATION_RATE", 1)}, false
	}
}

func rateLimitKey(r *http.Request, policy RateLimitPolicy) string {
	if userID, ok := UserID(r); ok && userID != "" {
		return policy.Name + ":user:" + userID
	}
	// Session cookie is HttpOnly and server-issued, so it's a stable per-client
	// identifier that doesn't collapse when a proxy (e.g. nginx) sits in front.
	if sessionID, ok := GetSessionCookie(r); ok {
		return policy.Name + ":session:" + sessionID
	}
	return policy.Name + ":ip:" + ClientIP(r)
}

// trustProxy controls whether X-Forwarded-For is honored. It must only be
// enabled when the backend sits behind a proxy that overwrites the header
// (see the frontend nginx config); otherwise clients can spoof their IP and
// bypass IP-based rate limiting.
var trustProxy = env.Bool("TRUST_PROXY", false)

// ClientIP extracts the client IP, preferring X-Forwarded-For only when the
// deployment is configured to trust an upstream proxy.
func ClientIP(r *http.Request) string {
	if trustProxy {
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			return strings.TrimSpace(strings.Split(forwarded, ",")[0])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}
