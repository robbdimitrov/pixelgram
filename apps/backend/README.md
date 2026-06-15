# Pixelgram Go Backend

The backend is a stateless Go HTTP service built with `net/http` and `pgx`.
It owns users, sessions, posts, comments, likes, and image upload metadata.

## Local Commands

```sh
go run ./cmd/api
go test ./...
make test-integration
go build ./cmd/api
```

When `DATABASE_URL` is unset, the service uses no-op stores for local handler
development. Database-backed behavior requires:

- `DATABASE_URL`
- `SESSION_HASH_SECRET`
- `IMAGE_DIR` (optional, defaults to `/tmp`)

## Navigation

- Composition and authentication boundaries: `internal/app/`
- HTTP helpers and middleware: `internal/httpx/`
- Feature modules: `internal/{users,sessions,uploads,posts,comments}/`
- Shared PostgreSQL lifecycle, retries, and circuit breaking: `internal/database/`
- Module PostgreSQL repositories: `internal/store/postgres/`
- Explicit local no-op repositories: `internal/noop/`
- Entrypoint and process lifecycle: `cmd/api/main.go`

Each feature module owns its domain types, repository interface, application
service, HTTP handler, and route registration. Handlers parse transport data
and map responses; services own workflows and authorization distinctions.

## PostgreSQL Integration Tests

`make test-integration` starts an ephemeral `postgres:18.4-alpine` container,
applies the real migrations with `migrate/migrate:v4.18.1`, runs the PostgreSQL
repository tests serially, and removes its containers and network on exit.
Database readiness is bounded to 60 seconds and emits container logs on failure.

Database tests compile as part of `go test ./...` and skip when
`PIXELGRAM_TEST_DATABASE_URL` is unset or `-short` is used.

## API Conventions

- JSON request bodies are limited to 100 KB.
- Multipart uploads are limited to 1 MB.
- Errors use JSON message envelopes.
- Authentication uses the `session` cookie.
- Persisted session IDs are HMAC-SHA256 digests using `SESSION_HASH_SECRET`.
