# TODO

Findings from post-audit code review. Fix in priority order within each tier.

---

## HIGH ✅

### H-01 — Comment delete is broken end-to-end ✅

Fixed in commit `dffddc9`:
- `CommentDto.id` and `Comment.id` changed from `number` to `string` (UUID)
- `userId` removed from `CommentDto` and `Comment` (was `json:"-"` on backend, never sent)
- `deleteComment` API function signature updated to `commentId: string`
- `+page.server.ts` action now validates `commentId` as UUID regex instead of `Number()`/`isInteger`
- `PostCard.svelte` visibility check changed from `comment.userId === currentUserId` to `comment.username === currentUsername || initialPost.username === currentUsername`
- `currentUsername: string` prop added to `PostCard`; all 3 callers updated

### H-02 — Circuit breaker trips on business logic errors ✅

Fixed in commit `61565f9`: added `store.ErrNotFound`, `store.ErrForbidden`, `store.ErrConflict` exclusions to `isTransientPostgresError` in `apps/backend/internal/database/breaker.go`.

### H-03 — Retry logic retries non-retriable errors ✅

Fixed by same change as H-02 — `withRetry` calls `isTransientPostgresError`, so the guard fixes both.

---

## MEDIUM

### M-01 — Redpanda Connect uses the Meilisearch master key at runtime 🔄

`deploy/broker.yaml` (the `connect` Deployment)

The backend deliberately provisions a scoped API key with only `search`, `documents.add`, and `documents.delete` on specific indexes. The Redpanda Connect pipelines use `${MEILI_MASTER_KEY}` directly, giving unrestricted Meilisearch admin access to the connect pod.

Fix: Provision a dedicated Meilisearch API key for the connect pipeline (only `documents.add` and `documents.delete` on `users`, `posts`, `hashtags`) during deployment and pass it to the connect Deployment as a separate secret. Do not pass `MEILI_MASTER_KEY` to connect at all.

---

### M-02 — Redpanda Connect and backfill use the Postgres superuser 🔄

`deploy/broker.yaml:319`, `deploy/broker-backfill.yaml:49`

Both use `postgresql://postgres:${POSTGRES_PASSWORD}@database:5432/phasma`. The connect service only reads the `outbox` table for CDC fan-out. A breach of the connect pod gives full superuser access to the database.

Fix: Create a dedicated role (e.g. `phasma_connect`) with `SELECT` on `outbox` only (plus replication privileges if using logical replication slots). Add a migration and a `provision-connect-user` step in deploy.sh. Pass those credentials to the connect and backfill Deployments via a new `connect-secret`.

---

### M-03 — Integer user IDs exposed in API responses ✅

Fixed: migration `000023_add_user_public_id` adds `public_id UUID` to users. User profiles now expose the UUID as `id`; the integer PK is hidden (`json:"-"`). Post responses drop `userId`. Login and user-creation endpoints return `{"username": "..."}`. Follow/unfollow routes changed from `{userId}` to `{username}`. Frontend types and API client updated; `PostCard` ownership check now compares username strings.

---

### M-04 — No egress NetworkPolicy ✅

Fixed in `deploy/network-policy.yaml`: `default-deny-egress` blocks all pod egress by default; explicit allow rules permit DNS (all pods → kube-dns:53), frontend → backend:8080, backend → database:5432/cache:6379/search:7700/storage:8333/broker:9092, and broker → database:5432/search:7700/storage:8333/broker:9092 (inter-broker).

---

## LOW ✅

### L-01 — UpdateUser error message omits email ✅

Fixed in commit `651ce35`: `apps/backend/internal/users/handler.go` now checks `|| email == ""` in the required-fields guard and says "Name, username, and email are required."

### L-02 — Upload proxy key pattern too permissive ✅

Fixed in commit `87ea5b8`: `apps/frontend/src/routes/uploads/[key]/+server.ts` pattern changed from `/^[A-Za-z0-9._-]{1,255}$/` to `/^[0-9a-f]{32}$/`. Redundant `includes('..')` check removed.

### L-03 — Follow/unfollow actions throw unhandled exceptions ✅

Fixed in commit `87ea5b8`: `apps/frontend/src/routes/(app)/[username=username]/+page.server.ts` follow/unfollow actions now wrap the API call in try/catch and return `fail(503, { error: ... })` on failure.

---

## NITPICK ✅

### N-01 — Session creation returns 200 instead of 201 ✅

Fixed in commit `651ce35`: `apps/backend/internal/sessions/handler.go` now returns `http.StatusCreated`. Test updated.

### N-02 — Shadowed variable in GetUser handler ✅

Fixed in commit `651ce35`: `apps/backend/internal/users/handler.go:GetUser` consolidated to a single `httpx.UserID(r)` call using `currentUserID, currentUserOK` — no more shadowed redeclaration.
