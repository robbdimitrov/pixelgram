# Pixelgram Go Backend

This is the parallel Go rewrite of `src/backend`. The TypeScript backend remains the active implementation until this backend reaches 1:1 compatibility and the image build is switched over.

## Current Status

- Scaffold exists under `src/backend-go`.
- Password hashing/session helper work has started and has unit tests.
- HTTP middleware foundation exists with tests for JSON errors, origin guard, and session validation behavior.
- `POST /users`, `GET /users/{userId}`, `PUT /users/{userId}`, `POST /sessions`, and `DELETE /sessions` handlers are wired against store interfaces with tests.
- `pgx` PostgreSQL store exists for user creation/retrieval/update, password update/session cleanup, login/session lookup/refresh/delete, and login failure tracking.
- `POST /uploads` and authenticated `GET /uploads/<filename>` are wired, including 1 MB file limit, image signature checks, expired upload cleanup, and pending quota.
- `cmd/api` uses PostgreSQL when `DATABASE_URL` is set and no-op stores otherwise.
- Kubernetes and `Makefile` still point at `src/backend`.
- Last verified commands:
  - `GOCACHE=/private/tmp/pixelgram-go-build GOMODCACHE=/private/tmp/pixelgram-go-mod go test ./...`
  - `GOCACHE=/private/tmp/pixelgram-go-build GOMODCACHE=/private/tmp/pixelgram-go-mod go build -o /private/tmp/pixelgram-backend-go ./cmd/api`

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
5. `internal/httpx/middleware.go`
6. `internal/users/handler.go`
7. `internal/sessions/handler.go`

Do not delete or replace the TypeScript backend until the Go backend passes compatibility tests and the frontend works unchanged through `/api`.

Next recommended step: implement image/feed/likes handlers and matching `pgx` store methods.
