# AGENTS.md

## Architecture

Three services, deployed via Kubernetes:
- `src/backend` — Go API (`net/http`, `pgx`)
- `src/database` — Migration image (`migrate/migrate`); runs as an init container in the backend deployment
- `src/frontend` — Angular 22 SPA (TypeScript, Tailwind CSS, DaisyUI, SCSS entrypoint)

Each active service has its own `Dockerfile` and dependencies. No monorepo tooling (no npm workspaces).

Services are stateless and must work correctly with multiple replicas. Keep implementations free of node-local state.

## Commands

### Build (Docker images)

```sh
make              # build all: backend, frontend
make backend      # build only the backend image
make frontend     # build only the frontend image
```

Images are tagged `localhost:5000/pixelgram/<service>`.

### Deploy

```sh
./scripts/deploy.sh        # preferred local kind deploy
```

Manual deployment:

```sh
kubectl create namespace pixelgram
kubectl create secret generic database-credentials -n pixelgram \
  --from-literal=postgres-password="$(openssl rand -hex 32)" \
  --from-literal=session-hash-secret="$(openssl rand -hex 32)"
kubectl apply -f ./k8s -n pixelgram
kubectl port-forward service/frontend 8080 -n pixelgram   # access at localhost:8080
```

### Cleanup

```sh
kubectl delete -f ./k8s -n pixelgram
kubectl delete namespace pixelgram
```

### Lint

```sh
# Backend
cd src/backend && go fmt ./...

# Frontend (from src/frontend)
npm run lint          # ng lint (ESLint with @angular-eslint)
```

### Backend dev server (not Docker)

When `DATABASE_URL` is unset, the backend automatically uses noop stores — useful for local handler testing without a real DB:

```sh
cd src/backend && go run ./cmd/api
```

### Frontend dev server (not Docker)

```sh
cd src/frontend && npm start
# Proxies /api → localhost:8080 (backend must be running separately)
```

To target the backend deployed in kind without rebuilding the frontend image:

```sh
kubectl port-forward service/backend 8080:8080 -n pixelgram
cd src/frontend && npm start
```

If local `8080` is occupied by the frontend port-forward, use another backend port with a temporary Angular proxy config.

### Tests

The active Go backend uses Go tests. The frontend uses Jest. Apply the 80/20 rule (Pareto principle) to testing: focus your testing effort on the 20% of the code (critical paths, complex logic, and high-risk areas) that provides 80% of the value and coverage, rather than wastefully chasing 100% coverage.

```sh
make test
```

## Environment variables (backend)

Set in `k8s/backend.yaml`:
- `DATABASE_URL` — PostgreSQL connection string
- `IMAGE_DIR` — path for uploaded image storage
- `SESSION_HASH_SECRET` — used to hash persisted session tokens

The backend reads `PORT` (defaults to `8080`).

## Backend navigation

- Routes: `internal/app/app.go`
- Store interfaces: each domain package (`users/`, `images/`, `sessions/`, `uploads/`)
- Postgres implementation: `internal/store/postgres/client.go`
- Session auth middleware (`httpx.RequireSession`) wraps the whole mux; routes that need to be public must be handled before that layer.

## Key conventions

- **Auth**: session-based via a `session` cookie (not JWT). Auth middleware is applied before routes.
- **Password hashing**: Argon2id PHC hashes via `golang.org/x/crypto/argon2` (not bcrypt).
- **Image uploads**: the frontend resizes large JPEG/PNG/GIF/WEBP files before upload, targeting <900KB. The backend still enforces a hard 1MB `POST /uploads` multipart limit. To create a post, upload the file first, then create the image record (`POST /images` with the returned filename).
- **Frontend Nginx**: in production, the nginx container proxies `/api/` → `http://backend:8080/`. During dev, `proxy.conf.json` handles the same proxy.
- **Database migrations**: `src/database/` contains a `migrate/migrate`-based image. It runs as a k8s init container in the backend deployment, so migrations always complete before the backend starts. Add new migrations as `NNNNNN_description.up.sql` / `.down.sql` pairs in `src/database/migrations/`.
- **No CI/CD, no pre-commit hooks** exist in this repo.
- **Commit messages**: use a single line, max 72 chars. No body, no trailers, no issue refs.
- **Frontend styling**: prefer DaisyUI and Tailwind utility classes in templates. Do not add inline `style` attributes or custom component SCSS/CSS for redesign work; use Tailwind config/theme tokens when styling needs to be shared.
- **Frontend icons**: use Lucide Angular icons for UI icons. Do not add ad hoc inline SVG icons unless Lucide cannot represent the needed symbol.
- **Frontend layout**: keep page widths intentional: `max-w-xl` for auth/settings/feed/single-post-like flows and `max-w-5xl` for profile grids, upload creation, and app-shell alignment.
- **Engineering quality**: use SOLID, DRY, and KISS principles. Write good code, remove needless duplication, and refactor toward simpler, clearer implementations when touching an area.

## Shared Style

- Follow **SOLID**, **KISS**, and **DRY** when writing code and refactoring: keep changes focused, prefer simple local patterns, avoid duplicated logic, and add abstractions only when they remove real complexity.
- Use standard initialisms in Go names (`ID`, `URL`, `HTTP`, `DB`). Generated identifiers are exempt.
- HTTP APIs return JSON consistently, including errors. Use symbolic `http.Status*` constants.
- Type API boundaries explicitly. Prefer `unknown` over `any`, map transport DTOs deliberately, and keep strict TypeScript enabled.
- Comments explain constraints or intent. Do not preserve implementation history, temporary reasoning, or narration of obvious code.
- Keep handwritten Go `gofmt`-clean. Regenerate generated code instead of editing it manually.
- Write behavior-oriented tests with typed fakes and framework-native HTTP test utilities.
- New migrations use two-space indentation, paired up/down files, and corrective migrations rather than rewriting applied history.
- Microservices must be stateless and designed to work properly in multi-replica environments.
- Frontend API response handling must tolerate `204 No Content` and non-JSON error bodies; avoid calling `response.json()` unconditionally.
- No CI/CD, no pre-commit hooks exist in this repo.
