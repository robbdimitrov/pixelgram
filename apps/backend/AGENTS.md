# Backend Instructions

These rules extend the repository-level `AGENTS.md` for files under `apps/backend/`.

## Stack and Navigation

- Go HTTP service using `net/http` and `pgx`
- Composition, routes, and authentication boundary: `internal/app/`
- HTTP helpers and middleware: `internal/httpx/`
- Feature modules: `internal/{users,sessions,uploads,posts,comments}/`
- PostgreSQL lifecycle, retries, and circuit breaker: `internal/database/`
- PostgreSQL repositories: `internal/store/postgres/`
- No-op local repositories: `internal/noop/`
- Process lifecycle: `cmd/api/main.go`

Each feature module owns its domain types, repository interface, service, handler, and route registration. Handlers parse transport data and map responses. Services own workflows and authorization distinctions.

## Commands

Run from `apps/backend/`:

```sh
go run ./cmd/api
go test ./...
go build ./cmd/api
```

Run `make test-integration` from the repository root for PostgreSQL repository tests.

When `DATABASE_URL` is unset, the backend uses no-op repositories for local handler development.

## Go and API Conventions

- Keep handwritten Go `gofmt`-clean.
- Use standard initialisms in names, including `ID`, `URL`, `HTTP`, and `DB`.
- Use symbolic `http.Status*` constants.
- HTTP APIs return JSON consistently, including errors.
- Parse request JSON through `httpx.DecodeJSON`; request bodies are bounded to 100 KB.
- Bound multipart and stream reads before parsing. Uploads have a hard 1 MB multipart limit and must be content-sniffed from magic bytes rather than trusted extensions or MIME headers.
- Validate identifiers with established validators such as `validation.ValidUUID` and `ValidUsername`.
- Use typed fakes and `httptest` for behavior-oriented tests.

## Authentication and Authorization

- Authentication uses the `session` cookie, not JWT.
- `httpx.RequireSession` wraps the mux. Only the explicit public allowlist (`POST /sessions`, `POST /users`, `GET /health`, and `OPTIONS`) bypasses it. New public routes require justification and must be registered before the auth layer.
- Never trust a client-supplied ID for authorization. Enforce ownership in the protected query or transaction where practical.
- Session IDs are generated with `crypto/rand`, validated, server-issued, HMAC-SHA256-hashed before persistence, and managed with a sliding TTL.
- Cookies remain `HttpOnly`, `SameSite=Strict`, and `Secure` behind TLS.
- Passwords use Argon2id PHC hashes with constant-time verification. Password changes revoke other sessions, and login failures remain throttled through `login_failures`.

## PostgreSQL and Distributed State

- Use `pgx` parameterized queries exclusively.
- Request data must never select SQL syntax. Any interpolated SQL fragment must come from a constrained internal constant and include a comment explaining the invariant.
- Make check-then-act operations atomic with a transaction, row lock, or database constraint.
- Do not retry non-idempotent writes. Operations eligible for retry must be demonstrably idempotent.
- The database-backed token bucket is the shared rate limiter. Add a `rateLimitPolicy` entry for new abuse-prone endpoints.

## Runtime and Operations

- `DATABASE_URL`, `IMAGE_DIR`, and `SESSION_HASH_SECRET` are configured in `deploy/backend.yaml`. `PORT` defaults to `8080`.
- `TRUST_PROXY` is valid only behind a proxy that overwrites forwarding headers. Normalize trusted proxy-derived identity before rate limiting.
- Keep recovery middleware outermost.
- Background goroutines must recover panics at their boundary. Work intentionally outliving a request must not retain the request's cancellable context.
- Scheduled or singleton work spanning replicas requires durable distributed coordination.
- Use structured `slog` JSON with propagated request IDs. Log security-relevant decisions using safe operational metadata only.
- Health endpoints remain lightweight and exempt from authentication and rate limiting. Readiness checks must cover dependencies required to serve traffic.
