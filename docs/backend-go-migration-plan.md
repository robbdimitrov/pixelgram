# Backend Go Migration Plan

## Goal

Rewrite `src/backend` from Express/TypeScript to Go with 1:1 HTTP and database compatibility.

Primary motivations:

- Reduce npm dependency surface for the backend.
- Align backend services around Go/Rust/Next.js instead of Node API services.
- Keep the project easy to reason about as a learning system.

Non-goals for the first migration:

- Redesigning the HTTP API.
- Changing the PostgreSQL schema.
- Changing frontend behavior.
- Moving image storage away from the current filesystem volume.
- Adding a Go web framework before the standard library proves insufficient.

## Baseline

Target Go version: latest stable Go available during implementation.

Initial dependencies:

- `github.com/jackc/pgx/v5/pgxpool` for PostgreSQL.
- `golang.org/x/crypto/argon2` for Argon2id password hashing.

Everything else should start with the standard library:

- `net/http` for routing and middleware.
- `encoding/json` for request and response bodies.
- `mime/multipart` plus `http.MaxBytesReader` for uploads.
- `crypto/hmac`, `crypto/sha256`, `crypto/rand`, and `crypto/subtle` for sessions and password helpers.
- `log/slog` for structured logging.
- `testing`, `httptest`, and table-driven tests.

Only add a dependency when it removes real complexity or risk. The first dependency to consider, if needed, is `chi` for routing, but the starting point should be stdlib `ServeMux`.

## Compatibility Contract

The Go backend must preserve:

- Route paths and methods.
- Status codes.
- JSON response shapes and frontend-facing error messages.
- Session cookie name and core options.
- Session ID format: 28-character base64 string from 21 random bytes.
- Session storage format: HMAC-SHA256 hash of the raw session ID using `SESSION_HASH_SECRET`.
- Existing database schema and SQL semantics.
- Upload limits: one multipart field named `image`, hard file limit of 1 MB.
- Upload image type checks by magic bytes for JPEG, PNG, GIF, and WEBP.
- Pending upload limit of 20 per user.
- Pending upload expiration of 1 hour.
- JSON body limit of 100 KB.
- Pagination defaults: `page=0`, `limit=10`, max `limit=50`.

The app may intentionally improve security headers as long as the frontend continues to work.

## Password Storage

Use Argon2id with PHC-encoded password hashes:

```text
$argon2id$v=19$m=19456,t=2,p=1$<base64-salt>$<base64-hash>
```

Default parameters:

- Memory: 19 MiB.
- Iterations: 2.
- Parallelism: 1.
- Salt: 16 random bytes.
- Hash: 32 bytes.

Implementation requirements:

- Parse the stored PHC string and verify using that hash's embedded parameters.
- Compare hashes with constant-time comparison.
- Keep parameters encoded in each password hash.
- Provide `NeedsRehash` so successful login can upgrade older/lower-cost hashes later.
- Add tests using at least one known Node-generated Argon2 hash.
- Keep login rate limiting. Argon2id protects offline attacks; rate limiting protects the live endpoint.

Do not add a pepper for the first migration. It is not useful without disciplined secret management and rotation.

## Test Strategy

Use the Pareto rule: cover the compatibility surface that would break users or the frontend.

The first test layer should be Go handler tests using `httptest` and a mock store interface. These should lock down:

- Malformed JSON returns `400` with `Malformed JSON request body.`
- Oversized JSON returns `413` with `Request body is too large.`
- Cross-origin state-changing requests return `403`.
- Missing session returns `401`.
- Malformed session cookie returns `401` and clears the cookie without hitting the database.
- Invalid session clears the cookie.
- Database errors during session validation return `500` without clearing the cookie.
- Login missing fields, invalid credentials, and rate limiting.
- Register validation and duplicate user conflict.
- Upload missing file, non-image file, valid image signature, oversized file, and quota exhaustion.
- Image create from pending upload only.
- Feed/user/liked pagination validation.
- Like, unlike, delete image status behavior.
- Password update validates old password and deletes other sessions.

The second test layer should be narrow store tests against a real PostgreSQL test database only for transactional behavior:

- Creating an image consumes exactly one pending upload.
- Updating an avatar consumes a pending upload or accepts an existing image.
- Deleting an image clears avatars using that filename.
- Login failure counters reset after expiration.

Avoid chasing 100% coverage. Do not write broad snapshot-style tests that make refactors noisy.

## Implementation Phases

## Current Migration Status

Started:

- Parallel Go backend scaffold added under `src/backend-go`.
- `go.mod` targets Go 1.26 and currently depends on `golang.org/x/crypto`.
- Minimal `cmd/api` starts an HTTP server and returns the current JSON `404` shape.
- `internal/auth/password.go` implements Argon2id PHC hashing, verification, and rehash checks.
- `internal/auth/session.go` implements Node-compatible session ID generation and HMAC-SHA256 token hashing.
- Unit tests cover password verification, a Node-generated Argon2id hash, rehash detection, session ID validation, and Node-compatible session token hashes.
- `src/backend-go/README.md` contains pickup notes for a fresh agent/context.

Last verified:

```sh
cd src/backend-go
GOCACHE=/private/tmp/pixelgram-go-build GOMODCACHE=/private/tmp/pixelgram-go-mod go test ./...
GOCACHE=/private/tmp/pixelgram-go-build GOMODCACHE=/private/tmp/pixelgram-go-mod go build -o /private/tmp/pixelgram-backend-go ./cmd/api
```

Not started:

- Request middleware.
- Store interfaces and pgx implementation.
- Route handlers.
- Kubernetes/Makefile cutover.

### Phase 1: Lock Current Behavior

Before replacing code, add or confirm tests for the current TypeScript backend's compatibility-critical behavior.

Exit criteria:

- Existing Jest tests pass.
- Any missing edge cases from the test strategy are either covered or explicitly deferred.

### Phase 2: Add Go Backend Skeleton

Create a parallel backend under `src/backend-go` or replace `src/backend` only after the skeleton is usable.

Suggested layout:

```text
src/backend-go/
  cmd/api/main.go
  internal/app/app.go
  internal/httpx/
  internal/auth/
  internal/store/
  internal/uploads/
  internal/users/
  internal/images/
  Dockerfile
  go.mod
```

Exit criteria:

- Server starts with `PORT`, `DATABASE_URL`, `IMAGE_DIR`, and `SESSION_HASH_SECRET`.
- Healthless 404 behavior matches current API for unknown routes.
- JSON/body/origin/session middleware exists.
- Minimal Docker image builds.

### Phase 3: Auth and Users

Port:

- `POST /users`
- `GET /users/:userId`
- `PUT /users/:userId`
- `POST /sessions`
- `DELETE /sessions`

Exit criteria:

- Session cookie lifecycle matches Express behavior.
- Existing Argon2 hashes verify.
- New Argon2id hashes are PHC encoded.
- Password update deletes other sessions.

### Phase 4: Uploads

Port:

- `POST /uploads`
- Static serving from `/uploads/<filename>`

Exit criteria:

- 1 MB hard limit works.
- One `image` file is accepted.
- Image signatures are checked from bytes, not file extension.
- Expired uploads are removed from the database and filesystem.
- Pending upload quota is enforced.

### Phase 5: Images and Likes

Port:

- `POST /images`
- `GET /images`
- `GET /users/:userId/images`
- `GET /users/:userId/likes`
- `GET /images/:imageId`
- `DELETE /images/:imageId`
- `POST /images/:imageId/likes`
- `DELETE /images/:imageId/likes`

Exit criteria:

- Response DTOs match current frontend expectations.
- Pagination behavior matches current backend.
- Delete permission behavior preserves `204`, `403`, and `404` distinctions.

### Phase 6: Swap Kubernetes and Makefile

Update:

- `src/backend/Dockerfile` or backend service path.
- `Makefile` backend target.
- `k8s/backend.yaml` only if image name, port, probes, or environment changes.
- `AGENTS.md` command docs.

Exit criteria:

- `make backend` builds the Go image.
- `./scripts/deploy.sh` deploys the Go backend.
- Frontend works unchanged through `/api`.

## Cutover Rule

Do not delete the TypeScript backend until the Go backend passes the compatibility tests and can run behind the existing frontend.

Prefer a single final switch from Node image to Go image. Avoid maintaining two live backend implementations unless there is a specific reason.

## Risk Register

- Argon2 PHC compatibility is the highest auth risk.
- Multipart upload behavior can differ from multer; test exact frontend-facing failures.
- Express path matching and Go `ServeMux` path matching are not identical; route tests should catch this.
- Cookie clearing header details may differ; preserve browser-relevant behavior rather than byte-for-byte header ordering.
- PostgreSQL timestamp formatting currently uses `time_format`; keep SQL formatting unchanged initially.
- `req.ip` behavior behind Kubernetes/proxies may differ; define the Go equivalent before porting rate limiting.
