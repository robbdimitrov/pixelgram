# Security and Stability Review Todo

Review date: 2026-05-31

## Verification

- [x] Install backend dependencies with `npm install`.
- [x] Install frontend dependencies with `npm install --legacy-peer-deps`.
- [x] Run frontend lint: `npm run lint` passes in `src/frontend`.
- [x] Run backend lint: `npm run lint` passes in `src/backend` after updating the parser target.
- [x] Run backend production dependency audit: `npm audit --omit=dev` reports 0 vulnerabilities.

## Current Upgrade State

- [x] Backend Docker build uses Node `26.2.0` via `node:26.2.0-alpine`.
- [x] Frontend Docker build uses Node `26.2.0` via `node:26.2.0-alpine`.
- [x] Root `.nvmrc` points local development shells to Node `26.2.0`.
- [x] Backend Docker install is lockfile-based with `npm ci --omit=dev --omit=optional`.
- [x] Frontend Docker install is lockfile-based with `npm ci --omit=optional --legacy-peer-deps`.
- [x] Backend runtime dependencies are updated to latest published versions as of 2026-05-31.

Fresh-session starting point:

- Continue from this file.
- Remaining unchecked items below are the open implementation work.
- Docker builds use Node `26.2.0`; this shell was on Node `v22.22.3` when the lint checks below were run.
- Run `nvm use` from the repository root before local Node work if `nvm` is available.
- Before changing behavior, rerun `npm run lint` in the touched service.
- Backend has no test script defined; add focused tests if adding one becomes part of a fix.

## High Priority

- [x] Restrict uploads to real image files on the backend.
  - Current issue: `src/backend/src/controllers/upload-controller.js` only enforces size and file count.
  - Todo: validate MIME type by content, reject non-image payloads, and return a clear `400`.
  - Status: done. Uploads are checked by image file signatures and invalid files are deleted.

- [x] Tie uploaded files to the authenticated user before creating image records.
  - Current issue: `POST /images` accepts any client-provided `filename`.
  - Todo: persist upload ownership or issue a pending upload token, then verify ownership when creating the image row.
  - Status: done. Pending uploads are recorded by user and consumed transactionally when creating an image.

- [x] Add server-side session expiration.
  - Current issue: cookies expire client-side, but `sessions` rows remain valid indefinitely.
  - Todo: add `expires_at`, check it in session validation, refresh or rotate sessions intentionally, and clean up expired rows.
  - Status: done. Sessions now have `expires_at`, validation requires it, active sessions refresh, and expired rows are cleaned up during login.

## Medium Priority

- [x] Add rate limiting for login/session creation.
  - Current issue: Argon2 verification runs with no throttle.
  - Todo: rate limit by IP and account/email, and keep failure responses generic.
  - Status: done. Failed logins are throttled in-process by IP and normalized email.

- [x] Validate and clamp pagination inputs.
  - Current issue: `limit` and `page` accept arbitrary values.
  - Todo: require non-negative page values, clamp `limit` to a small max, and return `400` for invalid input.
  - Status: done. Pagination now requires integer `page`/`limit`, rejects invalid values, and clamps `limit` to 50.

- [x] Make like/delete behavior status-aware and idempotent.
  - Current issue: duplicate likes can produce `500`; deletes return `204` even if no row was removed.
  - Todo: use `ON CONFLICT DO NOTHING` for likes, inspect `rowCount`, and return appropriate `404` or `403` responses.
  - Status: done. Duplicate likes are idempotent, like/unlike return `404` for missing images, and deletes distinguish `403` from `404`.

- [ ] Roll back optimistic like UI on request failure.
  - Current issue: the frontend mutates like state before the API succeeds and ignores errors.
  - Todo: either update after success or revert `liked`/`likes` in the error path.

- [ ] Move Kubernetes credentials into Secrets.
  - Current issue: database credentials are hardcoded in Kubernetes YAML.
  - Todo: create Kubernetes Secret manifests or documented secret creation commands; reference them through `valueFrom`.

## Low Priority

- [ ] Remove or wire the unused `SECRET` backend environment variable.
  - Current issue: `SECRET` is set in `k8s/backend.yaml` but appears unused because sessions are DB-backed.
  - Todo: remove it if not needed, or use it consistently if signed session data is introduced.

- [x] Tighten backend email validation.
  - Current issue: the regex has an unescaped dot and no end anchor.
  - Todo: use an anchored regex or a small validation helper/library.
  - Status: done. The backend email regex is anchored and escapes the domain dot.

- [ ] Remove forced change detection from edit profile.
  - Current issue: `EditProfileComponent` calls `detectChanges()` in `ngAfterViewChecked`.
  - Todo: move user loading to `ngOnInit` and remove the manual change detection loop.

- [x] Fix backend lint parser settings.
  - Status: done. `src/backend/eslint.config.js` now uses `ecmaVersion: 'latest'` and `sourceType: 'commonjs'`.

- [x] Update backend Docker base image to latest Node.
  - Status: done. `src/backend/Dockerfile` now uses `node:26.2.0-alpine`.
  - Note: Node's official release page lists v26.2.0 as the latest release and v24.16.0 as latest LTS on 2026-05-31.

- [x] Update backend runtime dependencies.
  - Status: done. Updated `argon2`, `express`, `helmet`, `multer`, and `pg` to latest published versions.
  - Note: `npm audit` reported 0 vulnerabilities after the update.

- [ ] Clean up stale frontend lint configuration.
  - Current issue: `src/frontend/tslint.json` remains even though linting uses ESLint.
  - Todo: delete the stale TSLint config if no tooling references it.

- [ ] Align Angular ESLint packages with Angular 21.
  - Current issue: Angular packages are 21.x while `@angular-eslint/*` packages are 15.x.
  - Todo: upgrade Angular ESLint packages to the matching supported major version and rerun frontend lint.
