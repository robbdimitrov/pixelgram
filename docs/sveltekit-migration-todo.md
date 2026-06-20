# Pixelgram: Angular → SvelteKit migration — execution todo

> Companion to the approved plan. Execute top-to-bottom. **Each `## Commit N` section is one
> commit** (single-line subject, ≤72 chars, no body/trailers — per `AGENTS.md`). Keep the
> build green at the end of every commit. Work in `apps/frontend-svelte/` until the final
> cutover commit renames it to `apps/frontend/`.

## Ground rules (read first)

- Stack is **fixed**: SvelteKit 2 + Svelte 5 (runes), TypeScript strict, Vite,
  `@sveltejs/adapter-node`, **Tailwind v4 (CSS-first)**, DaisyUI 5, `@lucide/svelte`. **Do not add
  any other runtime dependency** without explicit approval (the only open candidate is Playwright
  for e2e — ask first).
- **Native `fetch` only.** No axios/ky. `lib/api/*` functions take a `fetch` arg; **always
  pass `event.fetch`** (from `load`/actions/endpoints). The client is **imported
  server-only** — the browser never imports it.
- **BFF data-flow rule (non-negotiable):** reads → `+page.server.ts` `load`; writes → form
  actions in `+page.server.ts` (click-style mutations like/follow/delete are
  `<form method="POST" use:enhance>` mini-forms, **not** `fetch` in `onclick`);
  client-driven "load more" → a purposeful per-list `+server.ts` GET returning JSON.
  **No generic `/api` proxy. No fetch-on-mount in components.** The browser only ever hits
  intentional SvelteKit routes (CSP `connect-src 'self'`).
- **Image bytes are the one browser→backend exception:** served from a clean same-origin
  `/uploads/{key}` path routed by the **Ingress directly to the backend** (backend already serves
  `GET /uploads/{filename}` — no rewrite needed), never through the Node process. CSP
  `img-src 'self'`. The `imageUrl` pipe/helper emits `/uploads/{key}` (not `/api/uploads/...`).
- Principles: KISS / DRY / SOLID / clean, self-documenting code. Prefer native SvelteKit
  primitives over porting Angular machinery. Delete ceremony (no interceptors, no app
  initializer, no RxJS, no `@Pipe`/style-directive boilerplate).
- API resilience: tolerate `204 No Content` and non-JSON error bodies — never call
  `response.json()` unconditionally.
- Backend is **untouched**. Same un-prefixed contract; `handleFetch` strips `/api` server-side
  (no browser-facing proxy).
- Reference Angular source under `apps/frontend/src/` for exact behavior/markup when porting.
- After each commit: `npm run lint` + `svelte-check` clean before moving on.

---

## Commit 1 — Scaffold project + tooling

`chore: scaffold sveltekit frontend with tailwind/daisyui`

- [ ] `npm create svelte@latest` (Skeleton, TypeScript) into `apps/frontend-svelte`.
- [ ] Install + configure `@sveltejs/adapter-node` in `svelte.config.js`.
- [ ] Add **Tailwind v4** via `@tailwindcss/vite` (CSS-first, no `tailwind.config.js`) + DaisyUI 5;
      port theme tokens from `apps/frontend/tailwind.config.*` into `src/app.css`
      (`@import 'tailwindcss'; @plugin 'daisyui'`, `@theme`). Confirm DaisyUI themes (light/dark).
- [ ] Add `@lucide/svelte`. Verify a single-icon import tree-shakes.
- [ ] `tsconfig`: strict, `noUncheckedIndexedAccess`, no implicit any.
- [ ] ESLint + Prettier (Svelte plugins). `npm run lint` and `svelte-check` pass on skeleton.
- [ ] `src/app.html`: base document, `data-theme` placeholder on `<html>`.
- **Done when**: `npm run dev` serves a blank page; lint + check clean; `npm run build`
  produces a `build/` runnable with `node build`.

## Commit 2 — Shared types + utils

`feat: port shared types and utility functions`

- [ ] `src/lib/types/`: `User`, `Post`, `Comment`, `Pagination<T>` (`{items, nextCursor}`).
      Port from `apps/frontend/src/app/features/**/models/*` + `shared/models/pagination.model.ts`.
- [ ] `src/lib/utils/image-resizer.ts`: port **verbatim** from
      `shared/utils/image-resizer.ts` (Canvas/Blob/File; max 1600px, ~900KB, JPEG).
- [ ] `src/lib/utils/mappers.ts`: DTO→model mapping (port `shared/utils/mappers.ts`).
- [ ] Pipes → functions: `relativeDate.ts`, `pluralize.ts`, `imageUrl.ts`
      (port `shared/ui/pipes/*`). **`imageUrl.ts` returns `/uploads/${value}`** (not
      `/api/uploads/...`) — image bytes go through the ingress edge route.
- **Done when**: utils unit-importable; no Svelte/Angular coupling; check clean.

## Commit 3 — Typed API client (native fetch)

`feat: add typed api client for auth/users/posts`

- [ ] `src/lib/api/auth.ts`: `createUser`, `login` (POST `/api/sessions`), `logout` (DELETE).
- [ ] `src/lib/api/users.ts`: `getByUsername`, `getCurrent` (`/api/users/me`),
      `getFollowers`/`getFollowing` (cursor), `update`, `changePassword`,
      `follow`/`unfollow`.
- [ ] `src/lib/api/posts.ts`: feed / user-posts / liked (cursor), `getPost`, `create`,
      `delete`, `like`/`unlike`, comments list/create/delete, `uploadImage` (multipart).
- [ ] Each fn signature `(fetch, ...args)`; central response handler tolerating 204 +
      non-JSON errors; typed returns. Endpoint list mirrors
      `apps/frontend/src/app/features/**/services/*.service.ts`.
- [ ] Server-only: keep under `src/lib/server/api/` (or assert no browser import) so the
      backend transport never ships to the client.
- **Done when**: every endpoint typed and reused from one place (DRY); check clean.

## Commit 4 — SSR hooks, security, env (no generic proxy)

`feat: add ssr hooks and security headers`

Replaces `apps/frontend/src/server.ts` + `core/interceptors/*`. **No `/api/[...path]`
passthrough** — all backend access is server-mediated (BFF). The browser never calls `/api`.

- [ ] `svelte.config.js` `kit.csp`: `mode: 'nonce'`; port directives from `BASE_CSP`
      (keep `style-src 'unsafe-inline'`, `connect-src 'self'`, `img-src 'self'`).
- [ ] `src/hooks.server.ts`:
  - [ ] `handleFetch`: rewrite `/api/*` → `${BACKEND_URL}/*`, forward inbound `cookie`
        (port of `serverApiInterceptor`). This is how `load`/actions/endpoints reach Go.
  - [ ] `handle`: set `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` on
        every response.
  - [ ] `handleError`: server-side logging.
- [ ] `src/routes/health/+server.ts`: returns `ok`.
- [ ] Env via `$env/dynamic/private` (`BACKEND_URL`, `ALLOWED_HOSTS`) — never `$env/static/*`.
- **Done when**: a server-side `load` calling `lib/api/*` via `event.fetch` reaches backend;
  CSP header carries a per-request nonce; security headers present; `/health` ok.

## Commit 5 — Theme (SSR, no FOUC)

`feat: add ssr theme handling via cookie`

- [ ] `src/routes/+layout.server.ts`: read `theme` cookie, expose to layout.
- [ ] Root `+layout.svelte`: apply `data-theme` from server data (no FOUC).
- [ ] Theme store/rune: toggle writes `theme` cookie (`max-age=31536000; samesite=lax`) +
      `localStorage`. Port `core/theme.service.ts` semantics (system/light/dark).
- **Done when**: theme persists across reload with no flash; SSR matches client.

## Commit 6 — App shell + auth guard + navbar

`feat: add app layout group with session guard and navbar`

- [ ] `src/routes/(app)/+layout.server.ts`: fetch `/api/users/me` → `currentUser`;
      `throw redirect(303, '/login')` when unauthenticated. Replaces `SessionService` +
      `provideAppInitializer` + `authGuard`. Expose `currentUser` via layout data.
- [ ] `(auth)` group layout (no guard) for login/signup.
- [ ] `src/lib/components/Navbar.svelte` (port `shared/ui/components/navbar`), driven by
      `$page.data.currentUser`; lucide icons.
- [ ] `src/lib/components/EmptyState.svelte` (port `empty-state`).
- [ ] `src/lib/styles/`: shared Tailwind class constants replacing `AvatarStyle`/`CardStyle`/
      `FormControlStyle` directives. `src/lib/actions/trim.ts` (`use:trim`) replacing
      `TrimDirective`.
- **Done when**: unauthenticated hits redirect to `/login`; authed shell renders navbar.

## Commit 7 — Auth domain (login + signup)

`feat: add login and signup with form actions`

- [ ] `(auth)/login/+page.svelte` + `+page.server.ts` action → `login`. **Capture the
      backend `Set-Cookie` from the `event.fetch` response and re-emit via `cookies.set`.**
      Verify the `session` cookie lands in the browser — #1 silent breakage.
- [ ] `(auth)/signup/+page.svelte` + action → `createUser` then login.
- [ ] Logout action → `logout` + `cookies.delete`; idempotent (no re-entrant loop).
- [ ] `bind:value`, server-side validation, progressive enhancement; keep SvelteKit CSRF on.
- [ ] Layout widths: `max-w-xl`. Port markup/validation from `features/auth/pages/*`.
- **Done when**: signup → logged-in session → refresh stays authed → logout clears session,
  all verified in the browser (cookie present).

## Commit 8 — Route param matchers

`feat: add username and connections route matchers`

- [ ] `src/params/username.ts`: match `^@[a-z0-9._]{3,30}$` (keep the `@`); slice `@` in load.
- [ ] `src/params/connections.ts`: match `followers|following`.
- [ ] Port regex/intent from `app.routes.ts` matchers. Junk segments must fall through to 404.
- **Done when**: `/@valid` matches, `/feed` and `/garbage!!` do not route to profile.

## Commit 9 — Posts: feed + single post + comments

`feat: add feed, single post and comments`

- [ ] `src/lib/createPagination.ts`: reusable cursor-pagination rune helper (replaces
      `PaginationService`); used by feed/profile/comments (DRY). "Load more" fetches the
      next page from a purposeful `+server.ts` GET (below), not a generic proxy.
- [ ] `(app)/feed/+page.server.ts` (`load` first page via `event.fetch`) + `+page.svelte`;
      `(app)/feed/+server.ts` GET `?cursor=` → next page JSON for "load more".
- [ ] `(app)/posts/[publicId]/+page.server.ts` + `+page.svelte` (single post). Comment
      create/delete + like/unlike as named actions in this `+page.server.ts`.
- [ ] `(app)/[username=username]/likes/+page.server.ts` + `+page.svelte` (liked posts,
      feed-style) + matching `+server.ts` for "load more".
- [ ] `src/lib/components/Post.svelte`, `Comments.svelte` (port `feed/post`, `feed/comments`):
      like/unlike, comment create/delete as `<form use:enhance>` mini-forms → named actions;
      optimistic UI ok. Comments "load more" via a `+server.ts` GET.
- [ ] `loading="lazy"` + width/height on images (CLS). Layout width `max-w-xl`.
- **Done when**: feed paginates (load-more endpoint), single post loads, like + comment
      round-trip works without client-side JS (progressive enhancement).

## Commit 10 — Posts: upload/create

`feat: add image upload and post creation`

- [ ] `(app)/upload/+page.svelte` (+ redirects from `/upload/select`, `/upload/post`).
- [ ] Client resize via `image-resizer.ts` in the browser, then submit the resized blob in a
      `<form use:enhance>` → `+page.server.ts` action that calls `uploadImage` (multipart via
      `event.fetch`) then `create`. Port flow from `features/posts/pages/image-upload`.
      Width `max-w-5xl`.
- **Done when**: select → resize → upload → post appears in feed.

## Commit 11 — Users: profile + connections

`feat: add profile page with posts grid and follow lists`

- [ ] `(app)/[username=username]/+page.server.ts` (`load` profile + first posts page;
      follow/unfollow named actions) + `+page.svelte`; `+server.ts` GET for posts "load more".
- [ ] `(app)/[username=username]/[mode=connections]/+page.server.ts` + `+page.svelte`:
      followers/following lists; `+server.ts` GET for "load more".
- [ ] `ProfileHeader.svelte`, `Thumbnail.svelte` (port `users/pages/profile/*`); follow/
      unfollow as `<form use:enhance>` mini-forms; counts. Grid width `max-w-5xl`.
- **Done when**: profile, grid, followers/following, follow/unfollow all work.

## Commit 12 — Users: settings

`feat: add settings, edit profile and change password`

- [ ] `(app)/settings/+layout.svelte` + nested `+page`s: index, `profile`, `password`.
- [ ] Edit-profile (with avatar resize via `image-resizer.ts`) + change-password as form
      actions. Port from `features/users/pages/settings/*`. Width `max-w-xl`.
- **Done when**: profile edits + password change persist and reflect after reload.

## Commit 13 — Errors, 404, SEO, loading UX

`feat: add error pages, seo meta and loading states`

- [ ] `src/routes/+error.svelte` + catch-all → not-found (port `pages/not-found`).
- [ ] 401 from `load`/actions → `redirect(303, '/login')`.
- [ ] Per-page `<svelte:head>` title + OG tags (profile/post); check Angular Title parity.
- [ ] `$navigating`-driven pending indicators; optional `load` streaming for below-the-fold.
- **Done when**: bad URLs 404, 401s redirect, pages have titles, nav shows pending state.

## Commit 14 — Tests (high-value 20%)

`test: add vitest coverage for critical paths`

- [ ] Vitest + `@testing-library/svelte` (dev deps).
- [ ] Cover: auth flow, pagination helper, `image-resizer`, API client 204/non-JSON handling.
- [ ] No Playwright / e2e framework (not bundled with SvelteKit — skipped to keep deps
      minimal). Rely on the kind smoke test in Commit 15 for end-to-end coverage.
- **Done when**: `make test` (or `npm test`) green; covers the critical paths only.

## Commit 15 — Docker + deploy wiring

`build: dockerize sveltekit frontend and update deploy`

- [ ] `apps/frontend-svelte/Dockerfile`: multi-stage build → `node build`; uid 1000,
      `readOnlyRootFilesystem`, port 8080. `.dockerignore`.
- [ ] **adapter-node env** in `deploy/frontend.yaml`: `ORIGIN` (or `PROTOCOL_HEADER=
      x-forwarded-proto` + `HOST_HEADER=x-forwarded-host`) and `ADDRESS_HEADER=
      x-forwarded-for` — required for correct URLs + form-action CSRF behind ingress.
      Keep `BACKEND_URL`, `PORT`, `ALLOWED_HOSTS`, health `/health`, port 8080.
- [ ] **Ingress**: add a `/uploads` prefix rule → backend service (image bytes, no rewrite)
      **before** the `/` → frontend rule, so `<img>` bytes bypass the Node process.
- [ ] Update `Makefile` `frontend` target (build the new dir).
- **Done when**: `make frontend` builds; `./scripts/deploy.sh` runs; port-forward smoke test
  (signup → upload → feed → like → comment → follow → profile → settings → logout) passes.

## Commit 16 — Cutover: remove Angular, rename, docs

`refactor: replace angular frontend with sveltekit`

- [ ] Verify full parity in kind (Commit 15 smoke test) first.
- [ ] Delete old `apps/frontend` (Angular); **rename `apps/frontend-svelte` → `apps/frontend`**.
- [ ] Fix any path references (Makefile, Dockerfile paths, deploy, scripts).
- [ ] Update `AGENTS.md` frontend sections: SSR server → adapter-node + hooks; interceptor →
      `handleFetch`; transfer cache → `load` serialization; theme cookie → unchanged concept,
      new impl. Remove Angular-specific notes.
- **Done when**: repo builds/deploys from `apps/frontend`; AGENTS.md accurate; no Angular left.

---

## Final verification checklist

- [ ] `npm run lint` + `svelte-check` clean.
- [ ] `make test` green.
- [ ] Prod build (`node build`) with `BACKEND_URL` set: SSR auth works (cookie forwarded,
      authed first paint), no theme FOUC, CSP nonce present + `connect-src 'self'`, security
      headers present, multipart upload works via action, `/health` ok, and **no browser
      request hits `/api/*` for data** (verify in devtools network tab) — images load from
      `/uploads/*` via the ingress edge route.
- [ ] kind end-to-end smoke test passes.
- [ ] Dependency list contains only: svelte, @sveltejs/kit, adapter-node, vite, tailwindcss,
      @tailwindcss/vite, daisyui, @lucide/svelte (+ dev: eslint/prettier/svelte-check/vitest/
      testing-library).

---

## Appendix — SvelteKit recipes (copy-paste starting points)

Grounded in this doc's contract: cursor pagination (`{items, nextCursor}`), `/api/users/me`,
session cookie (no CSRF token header). Adjust names to the actual Angular source as you port.

```ts
// src/lib/server/api/http.ts — central response handler (tolerate 204 + non-JSON)
import { error } from '@sveltejs/kit';
export async function unwrap<T>(res: Response): Promise<T | null> {
  if (res.status === 204) return null;
  if (!res.ok) throw error(res.status, await res.text().catch(() => '') || `HTTP ${res.status}`);
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}
```

```ts
// src/hooks.server.ts — BFF transport (handleFetch) + security headers (handle)
import type { Handle, HandleFetch } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handleFetch: HandleFetch = async ({ request, fetch, event }) => {
  if (request.url.startsWith(`${event.url.origin}/api/`)) {
    const target = request.url.replace(`${event.url.origin}/api`, env.BACKEND_URL);
    const headers = new Headers(request.headers);
    headers.set('cookie', event.request.headers.get('cookie') ?? '');   // forward session
    request = new Request(target, new Request(request, { headers }));
  }
  return fetch(request);
};

export const handle: Handle = async ({ event, resolve }) => {
  const res = await resolve(event);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;   // CSP comes from svelte.config.js kit.csp (mode: 'nonce')
};
```

```ts
// src/routes/(auth)/login/+page.server.ts — form action; GOTCHA: re-emit backend Set-Cookie
import { fail, redirect } from '@sveltejs/kit';
import { parse as parseSetCookie } from 'set-cookie-parser';
export const actions = {
  default: async ({ request, fetch, cookies }) => {
    const data = await request.formData();
    const res = await fetch('/api/sessions', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
    });
    if (!res.ok) return fail(res.status, { error: 'Invalid email or password' });
    // handleFetch rewrites to BACKEND_URL (cross-origin) → Set-Cookie is NOT auto-applied.
    for (const c of parseSetCookie(res.headers.get('set-cookie') ?? '', { map: false }))
      cookies.set(c.name, c.value, { path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: c.maxAge });
    throw redirect(303, '/feed');
  },
};
```

```ts
// src/lib/createPagination.svelte.ts — reusable CURSOR pagination rune
export function createPagination<T>(
  initial: { items: T[]; nextCursor: string | null },
  fetchPage: (cursor: string) => Promise<{ items: T[]; nextCursor: string | null }>,
) {
  let items = $state(initial.items);
  let cursor = $state(initial.nextCursor), loading = $state(false);
  async function more() {
    if (loading || !cursor) return;
    loading = true;
    const next = await fetchPage(cursor);
    items = [...items, ...next.items]; cursor = next.nextCursor;
    loading = false;
  }
  return { get items() { return items; }, get done() { return !cursor; }, get loading() { return loading; }, more };
}
```
```ts
// src/routes/(app)/feed/+server.ts — purposeful cursor "load more" (NOT a generic proxy)
import { json } from '@sveltejs/kit';
import { getFeed } from '$lib/server/api/posts';
export const GET = async ({ fetch, url }) =>
  json(await getFeed(fetch, url.searchParams.get('cursor') ?? ''));
```

```svelte
<!-- like/follow as a mini-form → named action; optimistic, no full refetch -->
<script lang="ts">
  import { enhance } from '$app/forms';
  let { post } = $props();
  let liked = $state(post.liked); let likes = $state(post.likeCount);
</script>
<form method="POST" action="?/toggleLike" use:enhance={() => {
  const prev = { liked, likes };
  liked = !liked; likes += liked ? 1 : -1;
  return async ({ result, update }) => {
    if (result.type === 'failure') { liked = prev.liked; likes = prev.likes; }
    else await update({ invalidateAll: false });
  };
}}>
  <input type="hidden" name="publicId" value={post.publicId} />
  <button class:liked>{likes}</button>
</form>
```

```yaml
# deploy/frontend.yaml — add the /uploads image route BEFORE the "/" rule
- path: /uploads
  pathType: Prefix
  backend:
    service:
      name: backend
      port:
        number: 8080
```

```
# Per-commit dev loop (run from apps/frontend-svelte)
npm run dev            # backend reachable at $BACKEND_URL (port-forward backend)
npx svelte-check && npm run lint
npm run test           # from Commit 14 on
node build             # adapter-node prod bundle stays runnable from Commit 1
```
