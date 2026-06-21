# Architecture

## Service Topology

| Service | Role | Image |
|---|---|---|
| `frontend` | SvelteKit SSR BFF — sole public entry point | `localhost:5000/pixelgram/frontend` |
| `backend` | Go HTTP API — all business logic | `localhost:5000/pixelgram/backend` |
| `database` | Migration runner — init container only | `localhost:5000/pixelgram/database` |
| `postgres` | PostgreSQL — primary data store | `postgres` |
| `storage` | SeaweedFS — S3-compatible object storage | `chrislusf/seaweedfs` |
| `cache` | Dragonfly — rate limiting and login throttle | `docker.dragonflydb.io/dragonflydb/dragonfly` |
| `search` | Meilisearch — full-text search | `getmeili/meilisearch` |

## Request Flow

```
Browser → nginx Ingress → frontend:8080 (SvelteKit SSR)
                              │
                              └─ server-side only ─→ backend:8080 (Go HTTP)
                                                          │
                                           ┌──────────────┼──────────────┐
                                        postgres        storage        cache
                                        (pgx)          (S3 SDK)      (Valkey)
                                           │
                                        search
                                        (HTTP)
```

- The browser never calls the backend directly. `connect-src 'self'` CSP enforces the boundary.
- The frontend forwards the session cookie from its own cookie jar to the backend on every server-side API call.
- Image bytes (`/uploads/*`) stream through the frontend BFF — the browser only talks to its own origin.

## Component Responsibilities

### Frontend (SvelteKit)
- Renders all pages server-side via `load` functions.
- Proxies all mutations through form actions using `use:enhance`.
- Forwards `session` cookie to backend; re-emits it to the browser on login.
- Streams image blobs through without buffering.
- Resizes images client-side before upload (target < 900 KB; backend hard limit 1 MB).

### Backend (Go)
- Stateless HTTP API; all state lives in PostgreSQL, S3, Dragonfly, and Meilisearch.
- Auth boundary: `httpx.RequireSession` wraps all routes except the explicit public allowlist.
- Feature modules: `users`, `sessions`, `posts`, `comments`, `uploads`, `search`.
- Search outbox worker: drains `search_outbox` table and syncs to Meilisearch.
- Session cleanup goroutine: sweeps expired sessions every hour.
- Startup backfill: indexes all existing users, posts, and hashtags into Meilisearch on first replica. An advisory lock prevents redundant concurrent runs; concurrent runs are safe because all writes are idempotent upserts.

### Database (migrate/migrate)
- Runs as init container in the backend pod before the backend starts.
- Applies migrations from `apps/database/migrations/` using paired up/down files.

## Key Integration Patterns

- **Outbox pattern**: mutations to users, posts, and hashtags write a row to `search_outbox` inside the same transaction and call `pg_notify('search_outbox', '')`. The worker LISTEN connection wakes immediately; a fallback timer fires every 30 s.
- **Circuit breaker**: all PostgreSQL operations go through `database.DB.Read`/`Write`, which runs through a circuit breaker (5 consecutive transient failures → open; 30 s cooldown).
- **Token bucket rate limiting**: implemented in Lua on Dragonfly; keyed by `{policy}:user:{id}` > `{policy}:session:{id}` > `{policy}:ip:{ip}`.
- **Login throttle**: per-IP (5 failures) and per-email (50 failures) counters stored in Dragonfly with 15 min TTL.
- **Cursor pagination**: all list endpoints use `(created DESC, id DESC)` composite cursors encoded as base64 JSON.
