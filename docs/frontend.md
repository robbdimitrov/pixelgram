# Frontend

## Stack

SvelteKit with Svelte runes, `@sveltejs/adapter-node`, Tailwind, DaisyUI, `@lucide/svelte`, strict TypeScript.

## Route Groups and Guards

```
/                           → redirect 303 → /feed
├── (auth)/                 no layout guard; public
│   ├── login/              form action: POST /sessions
│   └── signup/             form action: POST /users then POST /sessions
└── (app)/                  +layout.server.ts: GET /users/me → redirect /login if 401
    ├── feed/               load: GET /posts
    ├── search/             load: GET /search?q=&type=
    ├── upload/             form action: POST /uploads → POST /posts
    ├── logout/             form action: DELETE /sessions → delete session cookie → redirect /login (cookie deleted even if backend call fails)
    ├── settings/           layout → redirect to sub-routes
    │   ├── profile/        form action: PUT /users/{id}
    │   └── password/       form action: PUT /users/{id}
    ├── posts/[publicId]/   load: GET /posts/{id} + GET /posts/{id}/comments
    └── [username=username]/ load: GET /users/{username} + GET /users/{username}/posts; actions: follow (POST /users/{id}/follow), unfollow (DELETE /users/{id}/follow)
        ├── likes/          load: GET /users/{username}/likes
        └── [mode=connections]/ load: followers or following list
```

## Layout Hierarchy

```
+layout.svelte (root)
  - loads: theme from cookie
  - renders: navigation progress bar + {children}

  (app)/+layout.svelte
    - loads: currentUser (GET /users/me) → redirect /login if absent
    - renders: <Navbar currentUser> + <main>{children}</main>
    - width: max-w-5xl px-4 pb-8 pt-4

  (auth)/ — no shared layout component
```

## Route Parameters and Matchers

| Param | Matcher | Pattern |
|---|---|---|
| `username` | `src/params/username.ts` | `^@[a-z0-9._]{3,30}$` (with leading `@`) |
| `mode` | `src/params/connections.ts` | `followers` or `following` |
| `publicId` | none | UUID validated in backend handler |

`stripAt()` removes the leading `@` before passing the username to backend API calls.

## Data Fetching Strategy

| Pattern | When used |
|---|---|
| `+page.server.ts` `load` | Initial page data — runs server-side |
| `+page.server.ts` `actions` | All mutations — POST form actions with `use:enhance` |
| `+server.ts` `GET` | Client-driven pagination "load more" — returns JSON |
| `createPagination()` | Client-side state for progressive list loading |

No data is fetched on component mount. The browser never calls the backend directly.

## SSR Boundary

Everything runs in the Node server. `apiClient(event)` resolves backend paths against `BACKEND_URL` env var and forwards the session cookie. These requests are server-to-server and never cross CORS.

Browser → SvelteKit server: form POST or page navigation.
Browser fetches for pagination: `GET /feed`, `GET /@{username}`, `GET /posts/{id}/comments`, `GET /search` — all route to SvelteKit `+server.ts` handlers, which call the backend server-side.

## Image Proxy

`GET /uploads/[key]` in `src/routes/uploads/[key]/+server.ts`:
- Validates `key` against `^[A-Za-z0-9._-]{1,255}$` and rejects `..` traversal.
- Streams response body directly from backend without buffering.
- Forwards: `content-type`, `content-length`, `etag`, `last-modified`, `cache-control`.

## Key Frontend Routes (API Endpoints)

| Path | Method | Handler | Backend call |
|---|---|---|---|
| `/feed` | GET | page load | GET /posts |
| `/feed` | GET | +server.ts | GET /posts?cursor= |
| `/search` | GET | page load | GET /search |
| `/search` | GET | +server.ts | GET /search?cursor= |
| `/suggest` | GET | +server.ts | GET /users/search or /hashtags/search |
| `/@{username}` | GET | page load | GET /users/{u} + GET /users/{u}/posts |
| `/@{username}` | GET | +server.ts | GET /users/{u}/posts?cursor= |
| `/@{username}/likes` | GET | page load | GET /users/{u}/likes |
| `/@{username}/likes` | GET | +server.ts | GET /users/{u}/likes?cursor= |
| `/@{username}/{mode}` | GET | page load | GET /users/{u}/followers or /following |
| `/@{username}/{mode}` | GET | +server.ts | GET /users/{u}/followers or /following?cursor= |
| `/posts/{id}/comments` | GET | +server.ts | GET /posts/{id}/comments?cursor= |
| `/uploads/[key]` | GET | +server.ts | GET /uploads/{key} (proxied) |
| `/health` | GET | +server.ts | returns `ok` text |

## `createPagination` (Svelte rune)

State: `items`, `cursor`, `loading`, `error`. Resets when `getInitial()` returns a new array reference (client-side navigation). `more()` appends and advances cursor. Used in feed, profile, liked posts, connections, search, and comment lists.

## Session Cookie Relay

On login, the backend sets `Set-Cookie: session=...` on its own origin. `applySessionCookie()` in `auth.ts` parses the `Set-Cookie` header and re-emits it on the SvelteKit origin. The cookie is then included in all subsequent `apiClient` calls via `event.cookies.get('session')`.

## Type Mapping

DTOs (`UserDto`, `PostDto`, `CommentDto`) are mapped to domain types (`User`, `Post`, `Comment`) via `mappers.ts`. The only transformation is `created: string → Date`.
