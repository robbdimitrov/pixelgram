# Implementation TODO — Search & Infrastructure

**Status: complete.** All phases shipped and verified.

| Phase | Task | Status |
|---|---|---|
| 1 | blobstore interface + S3 + in-memory backends | done |
| 1 | Serve uploads from blob store | done |
| 1 | SeaweedFS deployment, drop image PVC | done |
| 2 | Dragonfly rate-limit token bucket | done |
| 2 | Dragonfly login throttle | done |
| 2 | Drop UNLOGGED tables | done |
| 2 | Dragonfly deployment | done |
| 3 | Hashtag schema | done |
| 3 | Extraction helper and transactional tag writes | done |
| 3 | Typeahead endpoints (Postgres-backed) | done |
| 3 | Linkifier and `<Linkified>` component | done |
| 3 | Compose typeahead | done |
| 4 | Search outbox schema | done |
| 4 | Meilisearch client and index settings | done |
| 4 | Outbox writes, worker, backfill | done |
| 4 | Repoint typeahead, add `/search` | done |
| 4 | Search page and nav entry | done |
| 4 | Meilisearch deployment | done |
| 5 | Bound Argon2 concurrency | done |
| 5 | Re-hash passwords on login | done |
| 5 | Bound password length | done |
| 5 | Absolute session lifetime, background sweep | done |
| 5 | Dependency-aware readiness probe | done |
| 6 | README architecture and overview | done |

## Post-plan fixes (this session)

Changes made beyond the original plan during review:

- **Meilisearch filter injection** — `#`-prefixed search queries now validate the tag against `^[A-Za-z0-9_]{1,50}$` before building the filter string.
- **Query length alignment** — frontend `MAX_Q_LENGTH` corrected from 100 to 50 to match backend validation.
- **Outbox worker — SKIP LOCKED correctness** — SELECT, sync, and DELETE/UPDATE now run inside a single `pgx.Tx` so row locks are held throughout the batch, preventing duplicate processing at `replicas > 1`.
- **Outbox worker — per-tick deadline** — `context.WithTimeout(ctx, 30s)` caps total transaction hold time regardless of Meilisearch latency.
- **Outbox worker — LISTEN/NOTIFY** — worker holds a dedicated LISTEN connection; `pg_notify('search_outbox', '')` fires at commit time in every outbox-writing transaction. Replaces pure polling with event-driven wakeup; fallback timer (30s) covers connection loss.
- **Outbox worker — adaptive interval** — resets to 1s when work is found (drains backlog quickly), rises to 30s when idle (eliminates wasteful polling).
- **Outbox worker — goroutine race** — `sync.WaitGroup` ensures the LISTEN goroutine exits before the dedicated connection is released.
- **Outbox worker — logging** — `entity_id` added to sync-failure and dead-letter log lines.
- **syncPost hashtag read** — replaced `_ = w.db.Read(...)` + closure-captured error with direct error propagation, fixing silent proceed-with-empty-hashtags on circuit-breaker-open.
