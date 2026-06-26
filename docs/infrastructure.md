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

All custom images are pushed to `localhost:5000/phasma/<service>:<git-sha>`, where the tag is the short Git commit SHA (`GIT_SHA ?= $(shell git rev-parse --short HEAD)`). Built and pushed via top-level `Makefile` targets; `scripts/deploy.sh` passes the SHA to `make` and uses `kubectl set image` to roll out each new tag.
Third-party images in Kubernetes manifests are pinned to explicit version tags; do not use implicit `latest`.

## Init Container Sequencing

The backend pod runs the `database` migration image as a non-root init container before the backend container starts. Migrations must complete successfully before the backend accepts traffic.

## Service Accounts

Each workload has a dedicated `ServiceAccount` defined in `deploy/serviceaccounts.yaml` with `automountServiceAccountToken: false`. Dedicated accounts allow per-workload RBAC if needed in future without granting access at a shared default account. No RBAC rules are currently bound to any of these accounts.

## Services and Networking

All services are cluster-internal only. The nginx Ingress exposes only the `frontend` service on port 8080.
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

nginx Ingress at `phasma.localhost`. Routes HTTPS traffic to `frontend:8080` and redirects HTTP to HTTPS. `proxy-body-size: 2m` accommodates 1 MB image uploads plus multipart overhead. Local deployment creates a self-signed `frontend-tls` Secret; production should replace it with an ingress-managed certificate.

## Database TLS

All PostgreSQL connections use `sslmode=require`. The `database` StatefulSet is configured with `-c ssl=on`, `-c ssl_cert_file=/certs/tls.crt`, and `-c ssl_key_file=/certs/tls.key`. The cert and key are mounted from the `database-tls` Secret at `/certs` with mode `0640` so that the postgres user (uid/gid 70, `fsGroup: 70`) can read the key file. Local deployment generates a self-signed `database-tls` Secret with CN `database` and SANs for the Kubernetes service name; production should replace it with a properly issued certificate.

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
| broker | 512 Mi | 256 Mi | 200 m |
| connect | 256 Mi | 128 Mi | 100 m |

Redpanda is configured without `dev-container` mode or overprovisioning. The
single-node local deployment keeps explicit `--smp`, `--memory`, and
`--reserve-memory` startup values while disabling developer mode, default
write caching, and automatic topic creation (`auto_create_topics_enabled=false`).

## Health Probes

| Service | Liveness | Readiness | Startup |
|---|---|---|---|
| backend | GET /health | GET /ready (pings PostgreSQL) | GET /health, 30×2 s |
| frontend | GET /health | GET /health | GET /health, 30×2 s |
| database | pg_isready | pg_isready | pg_isready, 30×2 s |
| cache | tcpSocket :6379 | tcpSocket :6379 | tcpSocket :6379, 30×2 s |
| search | GET /health | GET /health | GET /health, 30×2 s |
| storage | tcpSocket :8333 | tcpSocket :8333 | tcpSocket :8333, 30×2 s |
| broker | GET :9644/v1/status/ready | GET :9644/v1/status/ready | GET :9644/v1/status/ready, 60×2 s |
| connect | GET :4195/ready | GET :4195/ready | GET :4195/ready, 30×2 s |

## Pod Disruption Budgets

`deploy/pdb.yaml` defines a `PodDisruptionBudget` with `maxUnavailable: 0` for each workload: `database`, `cache`, `broker`, `search`, `storage`, `backend`, and `frontend`. This prevents voluntary disruptions (node drains, rolling upgrades) from taking down any single-replica stateful service without operator awareness.

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
| `TRUST_PROXY` | literal `"true"` | Honor valid X-Forwarded-* headers from the ingress, which must overwrite client-supplied forwarding headers |
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
| `PROTOCOL_HEADER` | literal | Proxy protocol header |
| `HOST_HEADER` | literal | Proxy host header |
| `ADDRESS_HEADER` | literal | Proxy client IP header |

The frontend production manifest does not hardcode `ORIGIN`; adapter-node derives the request origin from `X-Forwarded-Proto` and `X-Forwarded-Host` set by the ingress. `scripts/deploy.sh` sets a local `ORIGIN` override only for direct service port-forwarding.
