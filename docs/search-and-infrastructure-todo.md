# Implementation TODO — Search & Infrastructure

Executable build for `search-and-infrastructure-plan.md`. Every value, file, and
boundary is fixed. Do the phases and tasks in order. Each task is one commit.

## How to execute (any model)

For every task: (1) read the listed files and one existing neighbour of the same
kind before writing, so new code matches existing structure and naming; (2) make
only the change described — no unrelated refactors or renames; (3) honor the Global
rules below; (4) run the task's verify commands until green; (5) use the exact
commit subject (commit only when the user asks); (6) report what was verified.

## Global rules

- **Interface trio.** A repository interface lives in `internal/<feature>`; its real
  impl in `internal/store/postgres`; its stub in `internal/noop`. Changing the
  interface means editing all three plus the `var _ Interface = (*T)(nil)`
  assertions.
- **DB access wrappers.** All Postgres access goes through `db.Read(...)` (retried,
  read-only/idempotent) or `db.Write(...)` (not retried, mutations). A
  `SELECT ... FOR UPDATE SKIP LOCKED` is a mutation → `db.Write`.
- **HA-ready, runs at 1.** Backend ships at `replicas: 1` but must be correct at
  `replicas: N`. No shared state in process memory. Every background goroutine runs
  on every replica; the only in-memory state is per-pod resource control and
  immutable startup config.
- **Frontend boundary.** Reads use `+page.server.ts` load; client lookups use a
  per-list `+server.ts` returning JSON via `apiClient(event)`. The browser never
  calls the backend. Never render user text with `{@html}`.
- **Security.** Validate and bound every untrusted input at the boundary. Every
  external call has a timeout, a bounded read, a fixed retry/fail policy, and errors
  that never leak endpoints/keys.
- **Verify (from the right dir):**
  - backend: `cd apps/backend && gofmt -l . && go build ./... && go test ./...`
  - frontend: `cd apps/frontend && npm run check && npm run lint && npm test`
  - repo: `make lint && make test`; integration: `make test-integration`.

## Deployment-manifest rules (every new `deploy/*.yaml`)

Mirror `deploy/database.yaml`: `app: pixelgram` + `tier: <name>` labels;
`securityContext` with `runAsNonRoot`, `runAsUser`/`Group`/`fsGroup`,
`seccompProfile: RuntimeDefault`, `allowPrivilegeEscalation: false`,
`capabilities: drop: [ALL]`, `readOnlyRootFilesystem: true` (data PVC writable);
resource requests/limits; readiness + startup + liveness probes; a Service
(`clusterIP: None` for stable identity). In `scripts/deploy.sh`: add the image to
the build/load step (`docker pull` → `docker save | docker exec -i
pixelgram-control-plane ctr --namespace k8s.io images import -`), add the
`statefulset/<name>` to the rollout-wait list, and add any new secret key to
`ensure_secret` (generated with `random_secret`).

## Fixed configuration values

| Env var | Default | Used by |
|---|---|---|
| `S3_ENDPOINT` | `http://seaweedfs:8333` | blobstore |
| `S3_BUCKET` | `pixelgram` | blobstore |
| `S3_REGION` | `us-east-1` | blobstore |
| `S3_FORCE_PATH_STYLE` | `true` | blobstore |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | from secret | blobstore |
| `DRAGONFLY_URL` | `redis://dragonfly:6379` | cache |
| `DRAGONFLY_PASSWORD` | from secret | cache |
| `MEILI_URL` | `http://meilisearch:7700` | search |
| `MEILI_MASTER_KEY` | from secret | search |
| `ARGON_MAX_CONCURRENCY` | `4` | auth |
| `SESSION_ABSOLUTE_TTL_HOURS` | `720` (30 days) | sessions |

New secret keys in `database-credentials`: `s3-access-key`, `s3-secret-key`,
`dragonfly-password`, `meili-master-key`. External-call timeouts: S3 10s,
Dragonfly dial 5s / op 3s, Meilisearch 5s. Backend pod memory: request `128Mi`,
limit `256Mi`.

---

## Phase 0 — Pre-flight (no commit)

- Confirm `make test` and `make lint` are green on a clean tree.
- Migration numbering has a gap at `000004` (filled by Phase 3); no schema has
  shipped, so editing and deleting existing migrations is correct.

---

## Phase 1 — SeaweedFS object storage

### 1.1 blobstore package [DONE]
- **Files:** new `apps/backend/internal/blobstore/blobstore.go`, `s3.go`,
  `memory.go`, `blobstore_test.go`.
- **Change:** define the interface
  ```go
  type Store interface {
      Put(ctx context.Context, key, contentType string, r io.Reader, size int64) error
      Get(ctx context.Context, key string) (rc io.ReadCloser, contentType string, size int64, err error)
      Delete(ctx context.Context, key string) error
  }
  ```
  and `var ErrNotFound = errors.New("blob not found")`. `s3.go`: `aws-sdk-go-v2`
  with static credentials, a custom endpoint resolver pointing at `S3_ENDPOINT`,
  `o.UsePathStyle = true`; each method wraps a 10s `context.WithTimeout`; map S3
  no-such-key to `ErrNotFound`. On construction, ensure the bucket exists
  (`HeadBucket`; `CreateBucket` if missing). `memory.go`: a `sync.RWMutex`-guarded
  `map[string][]byte` (+ content types) used when `DATABASE_URL` is unset.
- **Deps:** `github.com/aws/aws-sdk-go-v2/{config,credentials,service/s3}`;
  `go mod tidy`.
- **Tests:** put→get→delete round-trip and get-missing→`ErrNotFound` on the memory
  store.
- **Verify:** backend verify commands.
- **Commit:** `add blobstore interface with s3 and in-memory backends`

### 1.2 Serve uploads from the blob store [DONE]
- **Files:** `apps/backend/internal/uploads/handler.go`, `handler_test.go`;
  `internal/app/app.go`; `cmd/api/main.go`.
- **Change:** replace `ImageDir` with `Store blobstore.Store` on `uploads.Handler`
  and `uploads.Files`. Keep `fileLimit`, the `io.LimitReader(part, fileLimit+1)`
  bound, the `isImage` magic-byte sniff, and the 32-hex `uploadFilename` validation
  exactly. New flow: read the bounded bytes into memory, sniff the first 12 bytes,
  then `Put` under the 32-hex key with the sniffed content type. `ServeFile`: `Get`,
  set `Cache-Control: private, max-age=86400` and `ETag: "<key>"`, `io.Copy` the
  stream; `ErrNotFound`→404. `Files.Delete` and the expired-upload sweep call
  `Store.Delete`. Delete `uploadPath`, `DeleteUploadFile`, `deleteUploadFiles`, the
  `os`/`path/filepath` imports, and `Config.ImageDir`; add `Config.Blobs
  blobstore.Store`. In `main.go`, build the S3 store when `DATABASE_URL` is set, else
  the memory store, and pass it to `app.New`.
- **Tests:** update `handler_test.go` to the memory store; assert the object exists
  after upload, 404 on a missing key, and that size-limit and non-image rejections
  still hold.
- **Verify:** backend verify commands.
- **Commit:** `serve uploads from object storage`

### 1.3 SeaweedFS deployment, drop the image PVC
- **Files:** new `deploy/seaweedfs.yaml`; edit `deploy/backend.yaml`; delete
  `deploy/storagevolume.yaml`; edit `scripts/deploy.sh`.
- **Change:** `seaweedfs.yaml`: `StatefulSet` (1 replica, `chrislusf/seaweedfs
  server -dir=/data -s3 -s3.port=8333`), headless Service on `8333`,
  `volumeClaimTemplate` `5Gi` mounted at `/data`, per the deployment-manifest rules.
  `backend.yaml`: remove the `image-storage` volume + mount and `IMAGE_DIR`; add the
  `S3_*` env (access/secret from `database-credentials`); change `strategy` from
  `Recreate` to `RollingUpdate`; keep `replicas: 1`; raise memory limit to `256Mi`;
  rewrite the single-replica comment to state the cap is policy and the service is
  HA-ready. `scripts/deploy.sh`: add `s3-access-key`/`s3-secret-key` to
  `ensure_secret`, load `chrislusf/seaweedfs` into kind, add `statefulset/seaweedfs`
  to the rollout waits.
- **Verify:** `./scripts/deploy.sh`; upload works; `kubectl scale --replicas=2`
  shows images load from either pod, then scale back to 1; the image PVC is gone.
- **Commit:** `add seaweedfs object storage and drop the image pvc`

---

## Phase 2 — Dragonfly cache

### 2.1 Dragonfly rate-limit token bucket
- **Files:** `apps/backend/internal/httpx/ratelimit.go`, `ratelimit_test.go`;
  `cmd/api/main.go`.
- **Change:** remove `Cleanup` from the `RateLimiterStore` interface, the
  `NoopRateLimiterStore.Cleanup` method, `PostgresRateLimiterStore` entirely, and
  `startRateLimiterCleanup` + its call. Add `DragonflyRateLimiterStore` built on a
  shared `valkey.Client`. Implement `Allow` as one atomic Lua script that refills
  the bucket, decrements a token, and sets the key TTL, returning allowed + retry
  seconds. Preserve the existing policies, `rateLimitKey` derivation, `/health`
  exemption, and `RATE_LIMIT_FAIL_OPEN` (on a Dragonfly error, return
  `RateLimitDecision{Allowed: failOpen}` with the error). Add the `typeahead` policy
  to `rateLimitPolicy` (burst 20, rate 5) matching `GET /users/search`,
  `GET /hashtags/search`, `GET /search`. `openRateLimiter` in `main.go` builds the
  Dragonfly store from `DRAGONFLY_URL`/`DRAGONFLY_PASSWORD`, or
  `NoopRateLimiterStore` when `DRAGONFLY_URL` is unset.
- **valkey-go usage (exact patterns):**
  ```go
  client, err := valkey.NewClient(valkey.ClientOption{
      InitAddress: []string{"dragonfly:6379"}, Password: pw,
  })
  // Lua script:
  script := valkey.NewLuaScript(luaSrc)
  res := script.Exec(ctx, client, []string{key}, []string{strconv.Itoa(burst), ...})
  allowed, _ := res.ToArray() // parse the script's returned array
  ```
  Parse `DRAGONFLY_URL` with `valkey.ParseURL` to get `ClientOption`.
- **Deps:** `github.com/valkey-io/valkey-go`; `go mod tidy`.
- **Tests:** burst, refill, exhaustion, and fail-open behaviour against a Dragonfly
  test instance (integration); key-derivation unit tests unchanged.
- **Verify:** backend verify commands; integration.
- **Commit:** `move rate limiting to dragonfly token bucket`

### 2.2 Dragonfly login throttle
- **Files:** `apps/backend/internal/sessions/service.go`, `service_test.go`,
  `repository.go`, `domain.go`; new `internal/sessions/throttle.go`;
  `internal/store/postgres/sessions_postgres.go`; `internal/noop/repositories.go`;
  `internal/app/app.go`; `cmd/api/main.go`.
- **Change:** define
  ```go
  type LoginThrottle interface {
      GetFailures(ctx context.Context, keys []string) ([]LoginFailure, error)
      RecordFailure(ctx context.Context, key string) error
      Clear(ctx context.Context, keys []string) error
  }
  ```
  Dragonfly impl (`throttle.go`): `GetFailures` via `MGET` of the per-key counters;
  `RecordFailure` via one atomic Lua (`INCR`; on first increment `PEXPIRE` to the
  reset window) so the key auto-expires = reset; `Clear` via `DEL`. A noop impl for
  the `DRAGONFLY_URL`-unset path. Inject `LoginThrottle` into `sessions.NewService`;
  replace the four `repository.*LoginFailure*` calls; keep the email-vs-IP threshold
  logic in the service. On `GetFailures` error, fail open (proceed to password
  verification); `RecordFailure`/`Clear` are best-effort. Remove
  `GetLoginFailures`/`RecordLoginFailure`/`ClearLoginFailures`/
  `DeleteExpiredLoginFailures` from the session `Repository`, the Postgres impl, and
  `noop.Sessions`.
- **Tests:** threshold reached → `ErrLoginRateLimited`; reset after the window;
  Dragonfly-down → login still reaches password verification (fail open); decoy/
  constant-time path unchanged.
- **Verify:** backend verify commands.
- **Commit:** `move login throttling to dragonfly`

### 2.3 Drop the UNLOGGED tables
- **Files:** delete `apps/database/migrations/000005_create_rate_limits.{up,down}.sql`;
  edit `000002_create_sessions.{up,down}.sql` to remove the `login_failures` table
  and `login_failures_reset_at_idx` (up) and the matching `DROP` (down).
- **Verify:** a fresh `./scripts/deploy.sh` migrates cleanly; `grep -rn UNLOGGED
  apps/database/migrations/` returns nothing.
- **Commit:** `drop unlogged rate-limit and login-failure tables`

### 2.4 Dragonfly deployment
- **Files:** new `deploy/dragonfly.yaml`; edit `deploy/backend.yaml`
  (`DRAGONFLY_URL`, `DRAGONFLY_PASSWORD` from secret); edit `scripts/deploy.sh`.
- **Change:** `StatefulSet` (1 replica,
  `docker.dragonflydb.io/dragonflydb/dragonfly`, args `--requirepass=$(...)` from the
  secret), Service on `6379`, `volumeClaimTemplate` `1Gi` for snapshots, per the
  deployment-manifest rules. Add `dragonfly-password` to `ensure_secret`, load the
  image into kind, add the rollout wait.
- **Verify:** deploy; exceed the `strict` burst → 429; counters live in Dragonfly;
  login throttling works.
- **Commit:** `add dragonfly deployment`

---

## Phase 3 — Hashtags, mentions, links, typeahead

### 3.1 Hashtag schema [DONE]
- **Files:** new `apps/database/migrations/000004_create_hashtags.{up,down}.sql`.
- **Change:**
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE TABLE hashtags (
    id serial PRIMARY KEY,
    name varchar(50) UNIQUE NOT NULL,
    created timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE post_hashtags (
    post_id integer REFERENCES posts ON DELETE CASCADE,
    hashtag_id integer REFERENCES hashtags ON DELETE CASCADE,
    created timestamptz NOT NULL DEFAULT now(),
    UNIQUE(post_id, hashtag_id)
  );
  CREATE INDEX post_hashtags_hashtag_id_idx ON post_hashtags(hashtag_id);
  CREATE INDEX hashtags_name_trgm_idx ON hashtags USING gin (name gin_trgm_ops);
  CREATE INDEX users_username_trgm_idx ON users USING gin (username gin_trgm_ops);
  ```
  `.down.sql` drops the two indexes added to existing tables, `post_hashtags`, and
  `hashtags` (leave the extension).
- **Verify:** up/down migrate cleanly.
- **Commit:** `add hashtags and post_hashtags tables`

### 3.2 Extraction helper and transactional tag writes
- **Files:** new `apps/backend/internal/posts/extract.go`, `extract_test.go`;
  `internal/posts/service.go`, `service_test.go`;
  `internal/store/postgres/posts_postgres.go`, `postgres_test.go`;
  `internal/noop/repositories.go`.
- **Change:** `ExtractHashtags(description string) []string` matches
  `#([A-Za-z0-9_]{1,50})`, lowercases the capture, de-duplicates preserving first
  occurrence. Add `tags []string` to `Repository.CreatePost` (interface + Postgres +
  noop). In the existing `CreatePost` transaction, after the post `INSERT ...
  RETURNING`, for each tag run `INSERT INTO hashtags (name) VALUES ($1) ON CONFLICT
  (name) DO NOTHING`, then `INSERT INTO post_hashtags (post_id, hashtag_id) SELECT
  $1, id FROM hashtags WHERE name = $2 ON CONFLICT DO NOTHING`. `service.CreatePost`
  calls `ExtractHashtags(description)` and passes the result.
- **Tests:** extraction (case-fold, dedupe, reject `#` only / >50 / non-ASCII);
  repo test asserts tag + join rows are created atomically with the post.
- **Verify:** backend verify commands; integration.
- **Commit:** `extract and persist post hashtags transactionally`

### 3.3 Typeahead endpoints (Postgres-backed)
- **Files:** new `apps/backend/internal/search/` (`handler.go`, `service.go`,
  `repository.go`, `routes.go`, `domain.go`, tests);
  `internal/store/postgres/search_postgres.go`; `internal/noop/repositories.go`;
  `internal/app/app.go`, `routes.go`.
- **Change:** `GET /users/search?q=` and `GET /hashtags/search?q=` (protected).
  Validate `q` length 1–50 (else 400). Limit to 8 results. Postgres impl uses trgm
  similarity: `... ORDER BY similarity(name, $1) DESC LIMIT 8` (and the equivalent on
  `users.username`), returning minimal DTOs (`{username, avatar}`; `{name,
  postCount}` where `postCount` is `COUNT(*)` over `post_hashtags`). The `typeahead`
  rate-limit policy (added in 2.1) covers these paths.
- **Tests:** bound validation (empty / 51-char → 400), result cap, handler shape via
  `httptest`.
- **Verify:** backend verify commands; integration.
- **Commit:** `add user and hashtag typeahead endpoints`

### 3.4 Linkifier and `<Linkified>`
- **Files:** new `apps/frontend/src/lib/utils/linkify.ts`, `linkify.test.ts`; new
  `src/lib/components/Linkified.svelte`; edit `PostCard.svelte` (caption + comment
  body), `ProfileHeader.svelte` (bio).
- **Change:** `linkify(text)` returns an ordered array of
  `{ type: 'mention'|'hashtag'|'url'|'text', value: string, href?: string }`.
  Mentions (`@[a-z0-9._]{3,30}`) → `/@<name>`; hashtags (`#[A-Za-z0-9_]{1,50}`,
  lowercased) → `/search?q=%23<tag>`; only `http://`/`https://` URLs become external
  links; all else is text. `<Linkified text={...} />` renders tokens with explicit
  Svelte `<a>`/`<span>` elements inside a `whitespace-pre-wrap` wrapper, never
  `{@html}`; external links carry `target="_blank" rel="noopener noreferrer"`.
  Replace the raw `{description}`/comment `{body}`/`{bio}` spans with `<Linkified>`.
- **Tests:** mention/hashtag/url/text and mixed cases; non-http URL stays text;
  `<script>`/`&` input is escaped (no HTML injection).
- **Verify:** frontend verify commands.
- **Commit:** `render mentions, hashtags, and links in user text`

### 3.5 Compose typeahead
- **Files:** new `src/lib/components/Typeahead.svelte`; new
  `src/lib/utils/activeToken.ts`, `activeToken.test.ts`; new
  `src/routes/(app)/suggest/+server.ts`; new `src/lib/server/api/search.ts`; edit
  `(app)/upload/+page.svelte`.
- **Change:** `suggest/+server.ts` accepts `?type=users|hashtags&q=`, validates
  (`type` in the set, `q` length 1–50, else 400), proxies to the backend endpoints
  via `apiClient`, returns JSON. `activeToken.ts`: pure
  `activeToken(value, caret)` that scans left from `caret` over `[A-Za-z0-9._]`; if
  the run is immediately preceded by `@` or `#` at string start or after whitespace,
  returns `{ trigger, query, start, end }`, else `null`. `Typeahead.svelte` (DaisyUI
  dropdown, keyboard up/down/enter/escape, Lucide) takes an async fetcher and an
  `onselect`. In the upload textarea, on input compute `activeToken`, debounce 150ms,
  fetch suggestions, and on select splice `[start,end)` with the chosen text + a
  trailing space and restore the caret.
- **Tests:** `activeToken` (at caret, none, mid-word, trigger at start, after
  newline); endpoint validation (bad `type`/`q` → 400).
- **Verify:** frontend verify commands.
- **Commit:** `add mention and hashtag typeahead to the composer`

---

## Phase 4 — Meilisearch

### 4.1 Outbox schema
- **Files:** new `apps/database/migrations/000009_create_search_outbox.{up,down}.sql`.
- **Change:**
  ```sql
  CREATE TABLE search_outbox (
    id serial PRIMARY KEY,
    entity_type varchar(20) NOT NULL,
    entity_id varchar(255) NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    created timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX search_outbox_id_idx ON search_outbox(id);
  ```
  No payload column — the worker reads current state at apply time. `.down.sql`
  drops it.
- **Verify:** up/down migrate cleanly.
- **Commit:** `add search outbox table`

### 4.2 Meilisearch client and index settings
- **Files:** new `apps/backend/internal/search/meili.go`, `meili_test.go`; edit
  `cmd/api/main.go`.
- **Change:** a stdlib `net/http` client with a 5s timeout and bounded response
  reads. Methods: `upsertDocuments(index, docs)`, `deleteDocument(index, id)`,
  `search(index, q, filter, sort, offset, limit)`, and idempotent `applySettings`
  applied once on startup. Indexes: `users` (searchable `username`, `name`), `posts`
  (searchable `description`, `username`; filterable `hashtags`; sortable `created`),
  `hashtags` (searchable `name`; sortable `post_count`). On startup, use
  `MEILI_MASTER_KEY` only to apply settings and provision a scoped key; use the
  scoped key for query and document operations. Never log a key.
- **Tests:** `applySettings` is idempotent against a local Meilisearch
  (integration); request building unit-tested.
- **Verify:** backend verify commands; integration.
- **Commit:** `add meilisearch client and index settings`

### 4.3 Outbox writes, worker, backfill
- **Files:** `internal/store/postgres/posts_postgres.go`, `users_postgres.go`;
  new `internal/search/worker.go`; `cmd/api/main.go`.
- **Change:**
  - Outbox write: in the same tx as user create/update/delete and post
    create/delete, `INSERT INTO search_outbox (entity_type, entity_id)` the affected
    entity (post → `('post', public_id)`; user → `('user', id)`; a post create also
    enqueues each of its hashtags as `('hashtag', name)`). Atomic with the domain
    write.
  - Worker: one goroutine started in `main.go`, panic-recovered, with a context
    derived from a long-lived base (cancelled on shutdown), ticking every 1s. Each
    tick, `db.Write` a `SELECT id, entity_type, entity_id, attempts FROM
    search_outbox ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 100`. Coalesce rows by
    `(entity_type, entity_id)` keeping the max id. For each entity, read its current
    state from Postgres: if present, `upsertDocuments`; if absent,
    `deleteDocument`. On success, delete all locked rows for that entity. On failure,
    `UPDATE search_outbox SET attempts = attempts + 1`; when `attempts >= 5`, delete
    the row and log a dead-letter at `warn`. This is order-independent: applying
    current state means a stale row can never resurrect a deleted entity.
  - Backfill: in `main.go`, acquire `pg_try_advisory_lock(774191)` on a dedicated
    connection (`pool.Acquire`, `defer conn.Release()`); if acquired, stream every
    user, post, and hashtag and `upsertDocuments` them (idempotent), then
    `pg_advisory_unlock(774191)`; if not acquired, skip.
- **Tests:** outbox row written in the same tx as the domain write; worker
  idempotency, coalescing, dead-letter at 5 attempts, and `SKIP LOCKED` concurrency
  (integration).
- **Verify:** backend verify commands; integration.
- **Commit:** `index search documents via transactional outbox`

### 4.4 Repoint typeahead and add `/search`
- **Files:** `internal/search/repository.go` (swap impl to Meilisearch);
  delete `internal/store/postgres/search_postgres.go` (replaced by Meilisearch);
  `internal/app/routes.go`.
- **Change:** point `GET /users/search` and `GET /hashtags/search` at Meilisearch
  (same HTTP contract, no frontend change). Add `GET /search?q=&type=&cursor=`
  (protected): `type` in `users|posts|hashtags`, `q` length 1–50, page size 20. A
  leading `#` in `q` queries the `posts` index filtered by `hashtags = <tag>`. The
  response is `{ items, nextCursor }`; `nextCursor` is the base64 of the next
  Meilisearch offset, null at the end. The `typeahead` rate-limit policy covers
  `/search`.
- **Tests:** `/search` bound validation; `#`-prefixed query applies the hashtag
  filter; cursor advances and terminates (integration).
- **Verify:** backend verify commands; integration.
- **Commit:** `serve search and typeahead from meilisearch`

### 4.5 Search page and nav entry
- **Files:** new `src/routes/(app)/search/+page.svelte`, `+page.server.ts`,
  `+server.ts`; extend `src/lib/server/api/search.ts`; edit `Navbar.svelte`.
- **Change:** a search input with tabbed users/posts/hashtags results reusing
  `createPagination`, `Avatar`, `Thumbnail`, `EmptyState`. `q` starting with `#`
  preselects the hashtag-scoped posts tab; clicking a hashtag result sets
  `q=%23<name>` scoping the same page. `+page.server.ts` loads the first page;
  `+server.ts` drives client pagination via `apiClient`. Add a Lucide `Search` icon
  link to `/search` in `Navbar.svelte`.
- **Tests:** route renders each result type; `#`-prefixed `q` preselects the scoped
  view; pagination resets on query change.
- **Verify:** frontend verify commands.
- **Commit:** `add global search page`

### 4.6 Meilisearch deployment
- **Files:** new `deploy/meilisearch.yaml`; edit `deploy/backend.yaml` (`MEILI_URL`,
  `MEILI_MASTER_KEY` from secret); edit `scripts/deploy.sh`.
- **Change:** `StatefulSet` (1 replica, `getmeili/meilisearch`, `MEILI_MASTER_KEY`
  from the secret, `MEILI_ENV=production`), Service on `7700`, `volumeClaimTemplate`
  `1Gi` at `/meili_data`, per the deployment-manifest rules. Add `meili-master-key`
  to `ensure_secret`, load the image into kind, add the rollout wait.
- **Verify:** the Phase-4 end-to-end checklist in the plan passes on kind.
- **Commit:** `add meilisearch deployment`

---

## Phase 5 — Auth & operational hardening

### 5.1 Bound Argon2 concurrency, raise memory
- **Files:** `apps/backend/internal/auth/password.go`; `cmd/api/main.go`;
  `deploy/backend.yaml`.
- **Change:** add a package-level `golang.org/x/sync/semaphore.Weighted` sized to
  `ARGON_MAX_CONCURRENCY` (default 4), acquired around every `HashPassword`/
  `VerifyPassword` call so queued logins wait. The pod memory limit is `256Mi`
  (from 1.3); the safe relation is `limit ≈ base + concurrency × 19MiB`. The
  semaphore is per-pod by design (cluster concurrency is `replicas × cap`).
- **Deps:** `golang.org/x/sync/semaphore`; `go mod tidy`.
- **Tests:** no more than `cap` hashes run concurrently; behaviour unchanged under
  the cap.
- **Verify:** backend verify commands.
- **Commit:** `bound argon2 concurrency to the memory budget`

### 5.2 Re-hash passwords on login
- **Files:** `apps/backend/internal/auth/password.go`;
  `internal/sessions/service.go`, `service_test.go`;
  `internal/sessions/repository.go`; `internal/store/postgres/sessions_postgres.go`;
  `internal/noop/repositories.go`.
- **Change:** add `NeedsRehash(encodedHash string, target PasswordParams) bool`
  (true when stored params are below `DefaultPasswordParams`). After a successful
  `VerifyPassword` in `Login`, if `NeedsRehash`, re-hash the plaintext and persist
  via a new `UpdatePasswordHash(ctx, userID, hash)` repository method. A persist
  error must not fail the login.
- **Tests:** a below-target hash triggers rehash + update; an at-target hash does
  not; a persist error does not break login.
- **Verify:** backend verify commands.
- **Commit:** `upgrade password hashes on login`

### 5.3 Bound password length [DONE]
- **Files:** `apps/backend/internal/users/handler.go`;
  `internal/sessions/handler.go`; `internal/validation/validation.go`.
- **Change:** reject passwords shorter than 8 or longer than 1024 bytes at the
  boundary (signup, password change, and login), returning 400, before hashing.
- **Tests:** under-min and over-max → 400; boundary values accepted.
- **Verify:** backend verify commands.
- **Commit:** `bound password length`

### 5.4 Absolute session lifetime, sweep off the login path
- **Files:** `internal/store/postgres/sessions_postgres.go`;
  `internal/sessions/service.go`; `cmd/api/main.go`.
- **Change:** in `RefreshSession`, refuse to extend (treat as expired) any session
  whose `created` is older than `SESSION_ABSOLUTE_TTL_HOURS` (default 720). Remove
  `DeleteExpiredSessions` from `Login`; run it from a panic-recovered background
  goroutine in `main.go` every 1h with a long-lived context. The sweep runs on every
  replica; its `DELETE` is idempotent.
- **Tests:** a session past the absolute TTL is not refreshed; `Login` issues no
  cleanup `DELETE`.
- **Verify:** backend verify commands.
- **Commit:** `cap absolute session lifetime and sweep sessions off the login path`

### 5.5 Dependency-aware readiness probe
- **Files:** `apps/backend/internal/app/routes.go`; `cmd/api/main.go`;
  `deploy/backend.yaml`.
- **Change:** keep `/health` trivial for liveness/startup. Add a public, rate-limit-
  exempt `GET /ready` that pings Postgres with a 2s timeout (200 when reachable, 503
  otherwise) and excludes Dragonfly/Meilisearch (they fail open). Point
  `readinessProbe` at `/ready`; keep `livenessProbe`/`startupProbe` on `/health`.
- **Tests:** `/ready` returns 200 when the DB is reachable, 503 otherwise.
- **Verify:** backend verify commands; deploy and confirm a DB-down pod reports
  not-ready while staying alive.
- **Commit:** `add dependency-aware readiness probe`

---

## Phase 6 — README (runs last, after Phase 5)

### 6.1 Revise README architecture and overview
- **Files:** `README.md`.
- **Change:** (a) Replace the **Features** list so it reflects the final system —
  keep the existing entries and add: rich captions with `@mention`/`#hashtag`/link
  rendering and compose typeahead; global search; object storage (SeaweedFS via the
  S3 API); Dragonfly cache for rate limits and login throttling; Meilisearch search
  index fed by a transactional outbox; and that Postgres holds only durable data (no
  `UNLOGGED` tables). (b) Replace the **Architecture** Mermaid block verbatim with:
  ````
  ```mermaid
  graph TD
      Browser["Browser"]

      subgraph cluster ["Kubernetes Cluster"]
          Web["Frontend / BFF<br>(SvelteKit SSR)"]:::frontend
          API["Backend API<br>(Go)"]:::backend
          Worker["Outbox Worker<br>(in-process)"]:::backend

          subgraph data ["Data & Storage"]
              DB[("PostgreSQL<br>source of truth")]:::database
              Cache[("Dragonfly<br>rate limits + login throttle")]:::cache
              Blob[("SeaweedFS / S3<br>image objects")]:::storage
              Search[("Meilisearch<br>derived search index")]:::search
          end
      end

      Browser -->|HTTPS, same-origin| Web
      Web -->|REST, session cookie| API
      API -->|SQL + outbox row in tx| DB
      API -->|token buckets / counters| Cache
      API -->|S3 API| Blob
      API -->|query| Search
      Worker -->|SELECT ... SKIP LOCKED| DB
      Worker -->|upsert / delete| Search

      classDef frontend fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff
      classDef backend fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
      classDef database fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
      classDef storage fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
      classDef cache fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
      classDef search fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff

      style cluster fill:transparent,stroke:#64748b
      style data fill:transparent,stroke:transparent
  ```
  ````
  (c) Below the services table, add an **Infrastructure** subsection listing the
  three in-cluster datastores deployed as `StatefulSet`s: Dragonfly
  (Redis-protocol cache — rate-limit token buckets and login-failure counters),
  SeaweedFS (S3-compatible object storage for image bytes), and Meilisearch (derived
  search index). State that Postgres is the only source of truth and the others are
  ephemeral, blob, or derived stores. (d) Leave the video, Deploy, Cleanup, Testing,
  and License sections as-is.
- **Verify:** the Mermaid block renders (GitHub preview); links resolve.
- **Commit:** `docs: revise readme architecture for search and infra`

---

## Definition of Done (every task, against the diff)

1. Each untrusted input is validated and bounded at the boundary.
2. Auth/ownership gates intact (typeahead/search behind `RequireSession`; `/ready`
   the only new public route, justified).
3. Check-then-act is atomic: token bucket (Lua), tag writes (tx), outbox write
   (same tx), worker drain (`SKIP LOCKED`), backfill (advisory lock).
4. Every external call has a timeout, bounded read, fixed retry/fail policy, and
   safe errors.
5. Background goroutines have panic recovery, a request-independent context, and
   cross-replica safety.
6. Crafted input cannot inject HTML, bypass limits, or create disproportionate work.
7. Behaviour-oriented tests cover the critical success and failure paths.
8. Diff reviewed for correctness, security, simplicity, duplication, naming, stale
   comments, and accidental changes.
9. Formatters, linters, tests, and (proportionate) integration/deploy checks run.
10. Any verification that could not run is reported explicitly.
