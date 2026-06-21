# Pixelgram: Rich Captions, Object Storage, Cache, and Search

Architecture and decision record. The executable, step-by-step build is in
`search-and-infrastructure-todo.md`. Every decision here is final; the todo
contains exact files, signatures, values, and commit boundaries. Nothing in either
document is optional or deferred.

## What we build

Five phases, delivered in order:

1. **SeaweedFS object storage** — image bytes move from a local-disk PVC to an
   S3-API object store, removing the only constraint pinning the backend to one node.
2. **Dragonfly cache** — rate-limit token buckets and login-failure counters move
   off Postgres into Dragonfly, retiring both `UNLOGGED` tables.
3. **Hashtags, mentions, links, compose typeahead** — first-class hashtags in
   Postgres, clickable `@mention`/`#hashtag`/URL rendering, and `@`/`#` typeahead.
4. **Meilisearch** — a global `/search` page and the typeahead backing index, fed
   from Postgres by a transactional outbox and seeded by a one-shot backfill.
5. **Auth & operational hardening** — committed production-readiness work on the
   auth/session path surfaced during design.

A final documentation step (todo Phase 6) revises the README — architecture diagram
and overview — to reflect the built system.

Nothing has shipped, so existing migrations are edited directly (no corrective
migrations). The backend ships at `replicas: 1` and must be correct at
`replicas: N` (HA-ready); scaling out is a config change, never a code change.

## Data stores and their single responsibilities

Postgres is the only source of truth. Every other store is ephemeral, a blob sink,
or a derived read model — each rebuildable, none authoritative.

| Store | Role | Owns | On loss | Failure policy |
|---|---|---|---|---|
| **Postgres** | System of record | users, sessions, posts, likes, comments, follows, hashtags + post_hashtags, uploads, search_outbox — all durable/logged (no `UNLOGGED`) | Restore from backup | Circuit breaker + retry (`internal/database`) |
| **Dragonfly** | Ephemeral hot counters | rate-limit token buckets + login-failure counters, TTL-keyed | Counters reset, harmless | Fail open |
| **SeaweedFS (S3)** | Immutable blob bytes | image objects keyed by 32-hex `filename` | Images gone, rows intact | Errors map to safe HTTP; never leak endpoint/keys |
| **Meilisearch** | Derived read model | search index for typeahead, `/search`, hashtag results | Rebuild from Postgres (backfill) | Outbox queues; search degrades, writes unaffected |

Binding rules:

- **No dual writes.** A domain write and its `search_outbox` row commit in one
  Postgres transaction. A worker drains the outbox into Meilisearch.
- **Hashtags are Postgres entities** (`hashtags` + `post_hashtags`, mirroring the
  `likes`/`follows` join convention) feeding the index and exact counts. A hashtag
  click routes to `/search?q=%23tag` (Twitter-style). There is no `/tags/:tag` route.
- **Sessions stay in Postgres** (durable). Only the ephemeral counters go to
  Dragonfly.
- **Image bytes stream through the backend** (`GET /uploads/{key}`); the bucket is
  private, preserving same-origin and CSP `connect-src 'self'`.

## Architecture

```
Browser ──(same-origin, CSP self)──> SvelteKit BFF ──(apiClient, server fetch)──> Go backend
                                                                                    │
                  ┌──────────────────────────────────────────────┬────────────────┼───────────┐
                  ▼                                                ▼                ▼           ▼
            Postgres (truth)                                  Dragonfly        SeaweedFS   Meilisearch
  users/sessions/posts/hashtags/search_outbox            rate limits +        images(S3)  search (derived)
                  │                                       login failures                       ▲
                  └── outbox row committed in same tx ──> worker drains (SKIP LOCKED) ─────────┘
```

New infra clients (`internal/blobstore`, `internal/search`, the Dragonfly stores)
live alongside `internal/database`. All config is read in `cmd/api/main.go` via the
typed `internal/env` helpers and threaded through `app.Config`. Every external call
has an explicit timeout, a bounded response read, and a fixed retry/fail policy.

## Decisions (final)

- **Self-hosted, lean stack.** Dragonfly, SeaweedFS, and Meilisearch run in-cluster.
  No managed services. Dragonfly is reached with `valkey-go`
  (`github.com/valkey-io/valkey-go`), an Apache-2.0 RESP client not governed by Redis
  Inc.; the datastore is Dragonfly. Object storage uses the S3 API; cache and search
  sit behind `DRAGONFLY_URL`/`MEILI_URL`. All four datastores are `StatefulSet`s
  mirroring `deploy/database.yaml`.
- **Login throttle fails open.** Moving the counters to Dragonfly decouples their
  availability from Postgres, creating a "login up, throttle store down" state. The
  throttle check fails open (login proceeds to Argon2id verification, the real
  gate), matching the request rate limiter. There is no fail-closed mode.
- **Outbox is order-independent.** `search_outbox` carries only `(entity_type,
  entity_id)` plus bookkeeping — no payload, no version. The worker coalesces rows
  per entity, reads the entity's current state from Postgres at apply time, and
  upserts it to Meilisearch (or deletes from the index when the row is absent). Two
  workers processing two rows for the same entity both converge to current state, so
  `SKIP LOCKED` reordering across replicas is irrelevant.
- **Backfill runs once.** On startup a replica takes a Postgres advisory lock on a
  dedicated pooled connection and indexes every user, post, and hashtag (idempotent
  upserts), then releases. Other replicas skip.
- **Meilisearch key scoping.** The master key is used only for index admin and key
  provisioning at startup; a derived scoped key serves all query and document
  operations. No key ever reaches the browser (the BFF boundary enforces this).
- **Typeahead has its own rate-limit policy** (`typeahead`: burst 20, rate 5/s),
  because per-keystroke traffic would trip or abuse the `read` policy.
- **Meilisearch powers all discovery once Phase 4 lands.** Phase 3 backs the
  typeahead endpoints with Postgres `pg_trgm`; Phase 4 repoints the same HTTP
  contract to Meilisearch with no frontend change.

## Horizontal scaling (HA-ready at one replica)

The backend ships at `replicas: 1` but is correct at `replicas: N`. Replicas are
stateless; all shared state lives in the four datastores. Every background goroutine
is written as if it runs on every replica.

| Component | Runs on | Why it is correct at N replicas |
|---|---|---|
| Rate-limit token bucket | every replica, per request | Single atomic Dragonfly Lua script keyed by policy+identity |
| Login throttle | every replica, per login | Atomic Dragonfly `INCR` + TTL per key |
| Image upload / serve | every replica | Bytes in shared SeaweedFS; any replica serves any key |
| Hashtag write on post create | every replica | Inside the post-create tx; `INSERT ... ON CONFLICT DO NOTHING` is idempotent |
| Outbox write | every replica, per domain write | Same tx as the domain row — atomic, no dual-write gap |
| Outbox worker | a goroutine on every replica | `SELECT ... FOR UPDATE SKIP LOCKED` drains disjoint rows; apply re-reads current state, so order-independent and idempotent |
| Backfill | one replica | Postgres advisory lock on a dedicated connection; others skip |
| Meili index settings | every replica on startup | `applySettings` is idempotent; concurrent application converges |
| Argon2 concurrency cap | per replica | Per-process semaphore sized to that pod's RAM; cluster concurrency is `N × cap`, which is intended |
| Expired-session / expired-upload sweep | a goroutine on every replica | Idempotent `DELETE`s; redundant runs are harmless |
| Sessions, rehash-on-login | every replica | Session state in Postgres; concurrent rehash is last-write-wins with two valid hashes |

Implementation invariants:

- No shared counters, locks, or caches in process memory. The only in-memory state
  is per-pod resource control (the Argon2 semaphore) and immutable startup config.
- The outbox worker drains via `db.Write` (a `SELECT ... FOR UPDATE SKIP LOCKED`
  mutates lock state and must not be auto-retried as an idempotent read).
- The backfill advisory lock is acquired, used, and released on the same connection
  (`pool.Acquire`, `defer conn.Release()`); a pool-level call would lose the lock.
- Background goroutines use a context derived from a long-lived base (never a
  request context) and recover panics at their boundary.

## Conventions

- **Security.** Validate and bound every untrusted input at the boundary (`q`,
  multipart at 1 MB + magic-byte sniff). Every external call (S3, Dragonfly, Meili)
  has a timeout, a bounded read, a fixed retry/fail policy, and safe errors. Secrets
  stay out of code, logs, and URLs. User text is rendered from escaped tokens and
  Svelte elements, never `{@html}`.
- **Containers.** Every `StatefulSet` mirrors `deploy/database.yaml`: `runAsNonRoot`,
  `allowPrivilegeEscalation: false`, `capabilities: drop: [ALL]`, `seccompProfile:
  RuntimeDefault`, read-only root filesystem with only the data PVC writable,
  `app: pixelgram` + `tier: <name>` labels, resource requests/limits, and
  readiness/startup/liveness probes.
- **Migrations.** Edited directly (pre-ship). Conventions: `serial`/`integer`/
  `varchar(N)`/`timestamptz`, `created timestamptz NOT NULL DEFAULT now()`, FKs as
  `<col> integer REFERENCES <table> ON DELETE CASCADE`, join tables via `UNIQUE(...)`,
  indexes named `<table>_<col>_idx`, two-space indent, paired up/down.
- **Naming.** Reuse `id`, `user_id`, `post_id`, `public_id`, `filename`,
  `description`, `created`, plus `hashtag_id`/`name`. Backend structs and frontend
  DTO→domain mappers carry these through unchanged.
- **Commits.** One logical change per commit, imperative subject ≤72 chars, no body
  or trailers, created only when the user asks. Boundaries follow the todo's tasks.

## Verification

- **Unit/lint:** `make lint` and `make test` green after every task.
- **Integration:** `make test-integration`, extended to cover the Dragonfly token
  bucket, SeaweedFS round-trip, and Meilisearch indexing/search using ephemeral
  containers.
- **End-to-end on kind** (`./scripts/deploy.sh`), per phase:
  - P1: upload an image and reload the feed; `kubectl scale --replicas=2`, confirm
    the image loads from either pod and rate limiting stays correct, then scale back
    to 1; confirm the object is in the bucket and the image PVC is gone.
  - P2: exceed the `strict` burst on `POST /sessions` (HTTP 429); confirm counters
    are in Dragonfly, `rate_limits` and `login_failures` are gone from Postgres, and
    login throttling still works.
  - P3: compose `@user` + `#tag` (typeahead suggests), publish, and see clickable
    mention/hashtag/link; the hashtag link targets `/search?q=%23tag`.
  - P4: search users/posts/hashtags with a typo; a caption hashtag opens
    `/search?q=%23tag` listing that tag's posts newest-first; create a post and see
    it indexed shortly after; stop Meilisearch, create a post, restart, confirm it
    catches up.
  - P5: a burst of concurrent logins never exceeds the pod memory budget; a session
    past the absolute TTL is rejected; `/ready` returns 503 when Postgres is
    unreachable while the pod stays alive.
- **Definition of Done:** every task closes the AGENTS.md 10-point checklist
  reproduced at the end of the todo.
