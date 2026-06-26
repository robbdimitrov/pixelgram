# Infrastructure

## Kubernetes Deployment Model

All services are deployed to the `phasma` namespace via manifests in `deploy/`. Local deployment targets a `kind` cluster.

| Workload | Kind | Replicas | Storage |
|---|---|---|---|
| `frontend` | Deployment | 1 | none (emptyDir /tmp) |
| `backend` | Deployment | 1 | none (stateless) |
| `database` | StatefulSet | 1 | PVC 5 Gi (ReadWriteOnce) |
| `storage` | StatefulSet | 1 | PVC 5 Gi (ReadWriteOnce) + emptyDir /tmp |
| `cache` | StatefulSet | 1 | PVC 1 Gi (ReadWriteOnce) |
| `search` | StatefulSet | 1 | PVC 1 Gi (ReadWriteOnce) + emptyDir /tmp |
| `broker` | StatefulSet | 1 | PVC 2 Gi (ReadWriteOnce) |
| `connect` | Deployment | 1 | none (stateless) |

## Image Registry

All custom images are pushed to `localhost:5000/phasma/<service>`. Built and pushed via top-level `Makefile` targets.
Third-party images in Kubernetes manifests are pinned to explicit version tags; do not use implicit `latest`.

## Init Container Sequencing

The backend pod runs the `database` migration image as a non-root init container before the backend container starts. Migrations must complete successfully before the backend accepts traffic.

## Services and Networking

All services are cluster-internal only. The nginx Ingress exposes only the `frontend` service on port 8080.
Workloads do not need Kubernetes API access and disable automatic ServiceAccount token mounting.
NetworkPolicies default-deny pod ingress in the namespace, then allow only the frontend public port and the backend, database, cache, search, storage, and broker paths required by the service graph.

| Service name | Port | Protocol |
|---|---|---|
| `frontend` | 8080 | HTTP |
| `backend` | 8080 | HTTP |
| `database` | 5432 | PostgreSQL |
| `storage` | 8333 | S3 (HTTP) |
| `cache` | 6379 | Redis-compatible |
| `search` | 7700 | HTTP |
| `broker` | 9092 | Kafka |

`database`, `storage`, `cache`, `search`, and `broker` use headless services (`clusterIP: None`). The `broker` service sets `publishNotReadyAddresses: true`.

## Ingress

nginx Ingress at `phasma.localhost`. Routes all traffic to `frontend:8080`. `proxy-body-size: 2m` accommodates 1 MB image uploads plus multipart overhead.

## Secrets

All secrets are in the `database-credentials` Secret. Required keys:

| Key | Consumer |
|---|---|
| `postgres-password` | PostgreSQL, migration init container, backend DATABASE_URL |
| `session-hash-secret` | Backend HMAC session hashing |
| `s3-access-key` | Backend S3 client, SeaweedFS config |
| `s3-secret-key` | Backend S3 client, SeaweedFS config |
| `dragonfly-password` | Backend Dragonfly client |
| `meili-master-key` | Backend Meilisearch key provisioning, Meilisearch service |

## Security Context (all pods)

- `runAsNonRoot: true`
- `automountServiceAccountToken: false`
- `allowPrivilegeEscalation: false`
- `readOnlyRootFilesystem: true` (backend, frontend, cache, search, storage init, broker, connect; not PostgreSQL)
- `capabilities: drop: [ALL]`
- `seccompProfile: RuntimeDefault`

| Service | UID |
|---|---|
| backend | 65532 |
| backend migration init container | 65532 |
| frontend | 1000 |
| database | 70 |
| cache | 1000 |
| search | 1000 |
| storage | 65532 |
| broker | 101 |
| connect | 101 |

## Resource Limits

| Service | Memory limit | Memory request | CPU request |
|---|---|---|---|
| frontend | 768 Mi | 256 Mi | 250 m |
| backend | 256 Mi | 128 Mi | 100 m |
| backend migration init container | 64 Mi | 32 Mi | 50 m |
| database | 512 Mi | 512 Mi | 500 m |
| cache | 256 Mi | 128 Mi | 100 m |
| search | 512 Mi | 256 Mi | 100 m |
| storage | 256 Mi | 128 Mi | 100 m |
| broker | 512 Mi | 256 Mi | 250 m |
| connect | 256 Mi | 128 Mi | 100 m |

Redpanda is configured without `dev-container` mode or overprovisioning. The
single-node local deployment keeps explicit `--smp`, `--memory`, and
`--reserve-memory` startup values while disabling developer mode and default
write caching.

## Health Probes

| Service | Liveness | Readiness | Startup |
|---|---|---|---|
| backend | GET /health | GET /ready (pings PostgreSQL) | GET /health, 30×2 s |
| frontend | GET /health | GET /health | GET /health, 30×2 s |
| database | pg_isready | pg_isready | pg_isready, 30×2 s |
| cache | tcpSocket :6379 | tcpSocket :6379 | tcpSocket :6379, 30×2 s |
| search | GET /health | GET /health | GET /health, 30×2 s |
| storage | tcpSocket :8333 | tcpSocket :8333 | tcpSocket :8333, 30×2 s |
| broker | GET :9644/v1/status/ready | GET :9644/v1/status/ready | GET :9644/v1/status/ready, 30×2 s |

## Migration Strategy

- Migrations live in `apps/database/migrations/` as paired `NNNNNN_description.{up,down}.sql`.
- Applied via `migrate/migrate` in the init container before each backend rollout.
- Migration history is append-only; deployed schema defects require corrective migrations.

## PostgreSQL CDC Configuration

The `database` StatefulSet runs PostgreSQL with `-c wal_level=logical` to enable logical replication, which Redpanda Connect requires for the `pg_cdc` input. Only the `outbox` table is in the CDC publication (`outbox_relay`); no other tables require `REPLICA IDENTITY` changes.

## Environment Variables (backend)

| Variable | Source | Purpose |
|---|---|---|
| `DATABASE_URL` | constructed from secrets | PostgreSQL connection |
| `SESSION_HASH_SECRET` | secret | HMAC key for session tokens |
| `S3_ENDPOINT` | literal | SeaweedFS endpoint |
| `S3_BUCKET` | literal | S3 bucket name |
| `S3_REGION` | literal | S3 region |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | secrets | S3 credentials |
| `DRAGONFLY_URL` | literal | Dragonfly connection |
| `DRAGONFLY_PASSWORD` | secret | Dragonfly auth |
| `TRUST_PROXY` | literal `"true"` | Honor X-Forwarded-* headers |
| `MEILI_URL` | literal | Meilisearch endpoint |
| `MEILI_MASTER_KEY` | secret | Meilisearch key provisioning |
| `REDPANDA_BROKERS` | literal | Kafka broker address for consumers |
| `PORT` | literal `"8080"` | Listen port |

## Environment Variables (frontend)

| Variable | Source | Purpose |
|---|---|---|
| `BACKEND_URL` | literal | Backend service URL |
| `BODY_SIZE_LIMIT` | literal `"1100K"` | Allows resized image uploads plus multipart overhead before action validation |
| `NODE_ENV` | literal `"production"` | Enables production-mode SvelteKit/runtime security defaults |
| `PORT` | literal `"8080"` | Listen port |
| `ORIGIN` | literal | SvelteKit origin |
| `PROTOCOL_HEADER` | literal | Proxy protocol header |
| `HOST_HEADER` | literal | Proxy host header |
| `ADDRESS_HEADER` | literal | Proxy client IP header |
