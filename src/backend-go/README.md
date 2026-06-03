# Pixelgram Go Backend

This is the parallel Go rewrite of `src/backend`. The TypeScript backend remains the active implementation until this backend reaches 1:1 compatibility and the image build is switched over.

## Current Status

- Scaffold exists under `src/backend-go`.
- Password hashing/session helper work has started and has unit tests.
- No routes are wired yet.
- Kubernetes and `Makefile` still point at `src/backend`.
- Last verified command: `GOCACHE=/private/tmp/pixelgram-go-build GOMODCACHE=/private/tmp/pixelgram-go-mod go test ./...`.

## Compatibility Rules

Keep these stable unless the frontend and migration plan are updated deliberately:

- Same route paths, methods, status codes, JSON shapes, and frontend-facing error messages.
- Same `session` cookie name and browser-relevant options.
- Same raw session ID shape: 21 random bytes encoded with standard base64, producing 28 characters.
- Same persisted session ID shape: HMAC-SHA256 hex digest using `SESSION_HASH_SECRET`.
- Same PostgreSQL schema in `src/database/schema.sql`.
- Same upload field name: multipart file field `image`.
- Same hard limits: JSON body 100 KB, upload file 1 MB.

See `../../docs/backend-go-migration-plan.md` for the full plan and phase checklist.

## Local Commands

```sh
go test ./...
go build -o /private/tmp/pixelgram-backend-go ./cmd/api
```

Use `rtk` from the repository root when running commands through Codex:

```sh
rtk go test ./...
```

## Notes For The Next Agent

Start by reading:

1. `../../docs/backend-go-migration-plan.md`
2. This file
3. `internal/auth/password.go`
4. `internal/auth/session.go`

Do not delete or replace the TypeScript backend until the Go backend passes compatibility tests and the frontend works unchanged through `/api`.

Next recommended step: add `internal/httpx` and `internal/app` with JSON body limiting, malformed JSON errors, origin guard behavior, session middleware shape, and handler tests using a mock store.
