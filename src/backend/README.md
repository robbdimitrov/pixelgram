# Pixelgram Go Backend

The backend is a stateless Go HTTP service built with `net/http` and `pgx`.
It owns users, sessions, posts, comments, likes, and image upload metadata.

## Local Commands

```sh
go run ./cmd/api
go test ./...
go build ./cmd/api
```

When `DATABASE_URL` is unset, the service uses no-op stores for local handler
development. Database-backed behavior requires:

- `DATABASE_URL`
- `SESSION_HASH_SECRET`
- `IMAGE_DIR` (optional, defaults to `/tmp`)

## Navigation

- Composition and routes: `internal/app/app.go`
- HTTP helpers and middleware: `internal/httpx/`
- Domain handlers and store interfaces: `internal/<domain>/`
- PostgreSQL implementation: `internal/store/postgres/`
- Entrypoint and local no-op stores: `cmd/api/main.go`

## API Conventions

- JSON request bodies are limited to 100 KB.
- Multipart uploads are limited to 1 MB.
- Errors use JSON message envelopes.
- Authentication uses the `session` cookie.
- Persisted session IDs are HMAC-SHA256 digests using `SESSION_HASH_SECRET`.
