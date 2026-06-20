# AGENTS.md

## Architecture

Three services, deployed via Kubernetes:
- `apps/backend` — Go API (`net/http`, `pgx`)
- `apps/database` — Migration image (`migrate/migrate`); runs as an init container in the backend deployment
- `apps/frontend` — SvelteKit 2 SSR app (Svelte 5 runes, TypeScript strict, Vite, `@sveltejs/adapter-node`, Tailwind v4 CSS-first, DaisyUI 5, `@lucide/svelte`)

Each active service has its own `Dockerfile` and dependencies. No monorepo tooling (no npm workspaces).

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
kubectl apply -f ./deploy -n pixelgram
kubectl port-forward service/frontend 8080 -n pixelgram   # access at localhost:8080
```

### Cleanup

```sh
kubectl delete -f ./deploy -n pixelgram
kubectl delete namespace pixelgram
```

### Lint

```sh
# Backend
cd apps/backend && go fmt ./...

# Frontend (from apps/frontend)
npm run lint          # ESLint + Prettier check
```

### Backend dev server (not Docker)

When `DATABASE_URL` is unset, the backend automatically uses noop stores — useful for local handler testing without a real DB:

```sh
cd apps/backend && go run ./cmd/api
```

### Frontend dev server (not Docker)

```sh
cd apps/frontend && npm run dev
# Vite dev server; handleFetch rewrites /api/ → BACKEND_URL
```

To target the backend deployed in kind:

```sh
kubectl port-forward service/backend 8080:8080 -n pixelgram
cd apps/frontend && BACKEND_URL=http://localhost:8080 npm run dev
```

To run the production SSR bundle locally (after `npm run build`):

```sh
cd apps/frontend && BACKEND_URL=http://localhost:8080 node build
```

### Tests

The active Go backend uses Go tests. The frontend uses Vitest. Apply the 80/20 rule (Pareto principle) to testing: focus your testing effort on the 20% of the code (critical paths, complex logic, and high-risk areas) that provides 80% of the value and coverage, rather than wastefully chasing 100% coverage.

```sh
make test
```

## Environment variables (backend)

Set in `deploy/backend.yaml`:
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
- **Frontend SSR**: `@sveltejs/adapter-node` runs the SvelteKit app as a Node.js server. `src/hooks.server.ts` handles all cross-cutting concerns: `handleFetch` rewrites `/api/*` → `${BACKEND_URL}/*` and forwards the inbound `cookie` header so server-side `load` functions and form actions reach the backend authenticated. `handle` adds security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`). CSP with nonce is configured in `svelte.config.js` (`kit.csp` mode: `'nonce'`). Runs as uid 1000, `readOnlyRootFilesystem`, port 8080. Health probe path is `/health`.
- **BFF data-flow**: reads → `+page.server.ts` `load`; writes → form actions in `+page.server.ts` (`<form method="POST" use:enhance>`). Client-driven "load more" → purposeful per-list `+server.ts` GET returning JSON. No generic `/api` proxy. No fetch-on-mount in components.
- **Image serving**: image bytes go through the ingress directly to the backend via `/uploads/{key}` — they never pass through the Node process. `imageUrl()` helper returns `/uploads/${filename}`. CSP `img-src 'self'`. The `connect-src 'self'` constraint means the browser never directly calls `/api/*`.
- **Theme cookie**: `src/lib/theme.ts` writes a `theme` cookie alongside `localStorage`. An inline `<script nonce="...">` in `app.html` reads the cookie before paint and sets `data-theme` on `<html>` — no FOUC. The root `+layout.server.ts` exposes the theme from the cookie to layout data.
- **Database migrations**: `apps/database/` contains a `migrate/migrate`-based image. It runs as a k8s init container in the backend deployment, so migrations always complete before the backend starts. Add new migrations as `NNNNNN_description.up.sql` / `.down.sql` pairs in `apps/database/migrations/`.
- **Commit messages**: use a single line, max 72 chars. No body, no trailers, no issue refs.
- **Frontend styling**: prefer DaisyUI and Tailwind utility classes in templates. Themes configured CSS-first via `@plugin "daisyui/theme"` in `src/app.css`. Use `@theme` for custom tokens.
- **Frontend icons**: use `@lucide/svelte` icons. Do not add ad hoc inline SVG unless Lucide cannot represent the needed symbol.
- **Frontend layout**: keep page widths intentional: `max-w-xl` for auth/settings/feed/single-post-like flows and `max-w-5xl` for profile grids, upload creation, and app-shell alignment.

## Shared Style

- Follow **SOLID**, **KISS**, **DRY**, **YAGNI**, and the **Pareto principle** when writing code and refactoring: keep changes focused, prefer simple local patterns, avoid duplicated logic, add abstractions only when they remove real complexity, and never build for hypothetical future needs.
- Prefer one-liner solutions when they are readable, maintainable, and as optimal or better than a multi-line equivalent. Concise code is not a goal in itself — only collapse to a single line when it doesn't sacrifice clarity.
- Use standard initialisms in Go names (`ID`, `URL`, `HTTP`, `DB`). Generated identifiers are exempt.
- HTTP APIs return JSON consistently, including errors. Use symbolic `http.Status*` constants.
- Type API boundaries explicitly. Prefer `unknown` over `any`, map transport DTOs deliberately, and keep strict TypeScript enabled.
- Comments explain constraints or intent. Do not preserve implementation history, temporary reasoning, or narration of obvious code.
- Keep handwritten Go `gofmt`-clean. Regenerate generated code instead of editing it manually.
- Write behavior-oriented tests with typed fakes and framework-native HTTP test utilities.
- New migrations use two-space indentation, paired up/down files, and corrective migrations rather than rewriting applied history.
- Microservices must be stateless and designed to work properly in multi-replica environments.
- Frontend API response handling must tolerate `204 No Content` and non-JSON error bodies; the central `unwrap<T>()` helper in `src/lib/server/api/http.ts` handles this — always use it instead of calling `response.json()` directly.
