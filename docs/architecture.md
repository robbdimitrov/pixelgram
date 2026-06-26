# Architecture

## Service Topology

| Service | Role | Image |
|---|---|---|
| `frontend` | SvelteKit SSR BFF — sole public entry point | `localhost:5000/phasma/frontend` |
| `backend` | Go HTTP API — all business logic | `localhost:5000/phasma/backend` |
| `database` | Migration runner — init container only | `localhost:5000/phasma/database` |
| `postgres` | PostgreSQL — primary data store | `postgres` |
| `storage` | SeaweedFS — S3-compatible object storage | `chrislusf/seaweedfs:3.76` |
| `cache` | Dragonfly — rate limiting and login throttle | `docker.dragonflydb.io/dragonflydb/dragonfly:v1.25.0` |
| `search` | Meilisearch — full-text search | `getmeili/meilisearch:v1.11.3` |
| `broker` | Redpanda — Kafka-compatible event broker | `docker.redpanda.com/redpandadata/redpanda:v24.3.7` |
| `connect` | Redpanda Connect — CDC relay and Meilisearch/S3 sync | `docker.redpanda.com/redpandadata/connect:4.38.0` |

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

postgres (WAL) → connect (pg_cdc on outbox)
                     │
                     ├── topic: entity-changes ──► connect sync-search → search
                     │                         ──► connect cleanup-s3  → storage
                     │                         ──► backend notifications-consumer
                     │                         ──► backend feed-consumer
                     │
                     └── topic: activity ────────► backend notifications-consumer
                                                ──► backend feed-consumer
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
- Resizes all images client-side before upload via canvas re-encode to JPEG, targeting < 900 KB and max 1600 px on the longest side. Canvas encoding strips EXIF metadata. The backend hard limit is 1 MB.

### Backend (Go)
- Stateless HTTP API; all state lives in PostgreSQL, S3, Dragonfly, and Meilisearch.
- Auth boundary: `httpx.RequireSession` wraps all routes except the explicit public allowlist.
- Feature modules: `users`, `sessions`, `posts`, `comments`, `uploads`, `search`, `notifications`, `feed`.
- Upload handler decodes and re-encodes images to JPEG, stripping EXIF/GPS metadata and enforcing a 25 MP pixel dimension limit before storage.
- `notifications-consumer` and `feed-consumer`: franz-go consumer groups, each subscribing to both `entity-changes` and `activity` topics with distinct consumer group names so each receives the full stream independently. Record handling recovers panics per record and continues the batch so a single malformed or buggy event cannot restart the whole poll loop indefinitely.
- Session cleanup goroutine: sweeps expired sessions and deletes `outbox` rows older than 7 days every hour.

### Database (migrate/migrate)
- Runs as init container in the backend pod before the backend starts.
- Applies migrations from `apps/database/migrations/` using paired up/down files.

## Key Integration Patterns

- **Outbox pattern**: every domain mutation writes a row to `outbox` inside the same transaction. Payloads are marshaled from typed Go structs with `encoding/json`, never assembled with string formatting. The outbox is append-only; Redpanda Connect reads new rows via WAL CDC (`pg_cdc` input on `public.outbox`) and publishes to the appropriate Redpanda topic (`entity-changes` or `activity`). WAL position tracking gives at-least-once delivery; downstream consumers are idempotent.
- **CDC relay**: Redpanda Connect monitors the PostgreSQL WAL for INSERT events on `outbox`. Two pipelines run in Connect: `sync-search` (entity-changes → Meilisearch) and `cleanup-s3` (post deletes → S3 DELETE). A one-shot Kubernetes Job (`broker-backfill`) seeds existing data on first deploy.
- **Circuit breaker**: all PostgreSQL operations go through `database.DB.Read`/`Write`, which runs through a circuit breaker (5 consecutive transient failures → open; 30 s cooldown).
- **Token bucket rate limiting**: implemented in Lua on Dragonfly; keyed by `{policy}:user:{id}` > `{policy}:session:{id}` > `{policy}:ip:{ip}`.
- **Login throttle**: per-IP (5 failures) and per-email (50 failures) counters stored in Dragonfly with 15 min TTL.
- **Cursor pagination**: all list endpoints use `(created DESC, id DESC)` composite cursors encoded as base64 JSON.
