# AGENTS.md

## Architecture

Three independent services, deployed via Kubernetes:
- `src/backend-go` — Go API (`net/http`, `pgx`)
- `src/database` — PostgreSQL schema (auto-runs `schema.sql` on container init)
- `src/frontend` — Angular 21 SPA (TypeScript, Tailwind CSS, DaisyUI, SCSS entrypoint)

Each active service has its own `Dockerfile` and dependencies. No monorepo tooling (no npm workspaces). The old `src/backend` TypeScript/Express backend is legacy/reference code after the Go migration.

## Commands

### Build (Docker images)

```sh
make              # build all: backend, database, frontend
make backend      # build only the backend image
make database     # build only the database image
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
  --from-literal=postgres-password="$(openssl rand -base64 32)" \
  --from-literal=session-hash-secret="$(openssl rand -base64 32)"
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
cd src/backend-go && go fmt ./...

# Frontend (from src/frontend)
npm run lint          # ng lint (ESLint with @angular-eslint)
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
# Backend tests
cd src/backend-go && go test ./...

# Frontend tests
cd src/frontend && npx jest
```

## Environment variables (backend)

Set in `k8s/backend.yaml`:
- `DATABASE_URL` — PostgreSQL connection string
- `IMAGE_DIR` — path for uploaded image storage
- `SESSION_HASH_SECRET` — used to hash persisted session tokens

The backend reads `PORT` (defaults to `8080`).

## Key conventions

- **Auth**: session-based via a `session` cookie (not JWT). Auth middleware is applied before routes.
- **Password hashing**: Argon2id PHC hashes via `golang.org/x/crypto/argon2` (not bcrypt).
- **Image uploads**: the frontend resizes large JPEG/PNG/GIF/WEBP files before upload, targeting <900KB. The backend still enforces a hard 1MB `POST /uploads` multipart limit. To create a post, upload the file first, then create the image record (`POST /images` with the returned filename).
- **Frontend Nginx**: in production, the nginx container proxies `/api/` → `http://backend:8080/`. During dev, `proxy.conf.json` handles the same proxy.
- **Database init**: `schema.sql` is copied to `/docker-entrypoint-initdb.d/` in the Postgres image and automatically runs on first container start.
- **No CI/CD, no pre-commit hooks** exist in this repo.
- **Commit messages**: use a single line, max 72 chars. No body, no trailers, no issue refs.
- **Frontend styling**: prefer DaisyUI and Tailwind utility classes in templates. Do not add inline `style` attributes or custom component SCSS/CSS for redesign work; use Tailwind config/theme tokens when styling needs to be shared.
- **Frontend icons**: use Lucide Angular icons for UI icons. Do not add ad hoc inline SVG icons unless Lucide cannot represent the needed symbol.
- **Frontend layout**: keep page widths intentional: `max-w-xl` for auth/settings/feed/single-post-like flows and `max-w-5xl` for profile grids, upload creation, and app-shell alignment.
- **Engineering quality**: use SOLID, DRY, and KISS principles. Write good code, remove needless duplication, and refactor toward simpler, clearer implementations when touching an area.
