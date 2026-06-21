# API

All endpoints are served by the Go backend on port 8080. All responses are JSON. Error bodies are `{"message": "..."}`.

## Middleware Stack (outermost → innermost)

1. `RequestID` — accepts `X-Request-ID` or generates a 16-byte hex id; echoes it in the response header.
2. `Logger` — structured JSON request log with method, route pattern, path, status, duration.
3. `SecurityHeaders` — sets `X-XSS-Protection: 0`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`, `Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; connect-src 'self'`.
4. `OriginGuard` — for POST/PUT/PATCH/DELETE, rejects requests where `Origin` header is present but does not match the request host.
5. `RateLimit` — token bucket via Dragonfly Lua script; key priority: user id > session cookie > client IP.
6. `RequireSession` — validates `session` cookie; refreshes sliding TTL; injects `userID` into context. Exempt: `POST /sessions`, `POST /users`, `GET /health`, `OPTIONS`.

## Rate Limit Policies

| Policy | Endpoints | Burst | Rate (req/s) |
|---|---|---|---|
| strict | POST /sessions, POST /users, POST /uploads | 5 | 0.2 |
| typeahead | GET /users/search, GET /hashtags/search, GET /search | 20 | 5 |
| read | GET/HEAD (all others) | 120 | 2 |
| mutation | POST/PUT/PATCH/DELETE (all others) | 30 | 1 |
| exempt | GET /health, GET /ready | — | — |

Defaults are overridable via env vars `RATE_LIMIT_{POLICY}_{BURST,RATE}`.

## Endpoint Inventory

### Public (no auth required)

| Method | Path | Purpose |
|---|---|---|
| GET | /health | Liveness check — 204 No Content |
| GET | /ready | Readiness check — pings PostgreSQL (2 s timeout) |
| POST | /users | Create account |
| POST | /sessions | Login — sets `session` cookie |
| GET | /uploads/ | Serve uploaded file blob |

### Protected (session cookie required)

#### Sessions
| Method | Path | Purpose |
|---|---|---|
| DELETE | /sessions | Logout — clears session cookie |

#### Users
| Method | Path | Purpose |
|---|---|---|
| GET | /users/me | Get current authenticated user |
| GET | /users/{username} | Get user by username |
| PUT | /users/{userId} | Update profile or change password (own user only) |
| GET | /users/{username}/followers | List followers (cursor-paginated) |
| GET | /users/{username}/following | List following (cursor-paginated) |
| POST | /users/{userId}/follow | Follow a user |
| DELETE | /users/{userId}/follow | Unfollow a user |

#### Posts
| Method | Path | Purpose |
|---|---|---|
| POST | /posts | Create post from an upload |
| GET | /posts | Get feed (cursor-paginated) |
| GET | /posts/{publicId} | Get single post |
| DELETE | /posts/{publicId} | Delete own post |
| POST | /posts/{publicId}/likes | Like a post |
| DELETE | /posts/{publicId}/likes | Unlike a post |
| GET | /users/{username}/posts | List user's posts (cursor-paginated) |
| GET | /users/{username}/likes | List user's liked posts (cursor-paginated) |

#### Comments
| Method | Path | Purpose |
|---|---|---|
| GET | /posts/{publicId}/comments | List comments on a post (cursor-paginated) |
| POST | /posts/{publicId}/comments | Create a comment |
| DELETE | /posts/{publicId}/comments/{commentId} | Delete own comment |

#### Uploads
| Method | Path | Purpose |
|---|---|---|
| POST | /uploads | Upload an image file; returns `{filename}` |

#### Search
| Method | Path | Purpose |
|---|---|---|
| GET | /users/search?q= | Typeahead user search (up to 8 results) |
| GET | /hashtags/search?q= | Typeahead hashtag search (up to 8 results) |
| GET | /search?q=&type=&cursor= | Full search — type: `users`, `posts`, or `hashtags`; requires Meilisearch |

## Pagination Model

- All paginated endpoints accept `cursor` (base64url-encoded JSON `{created, id}`) and `limit` (1–50, default 10; values above 50 are silently clamped to 50) query parameters.
- Response shape: `{"items": [...], "nextCursor": "<string or null>"}`.
- `page` parameter is rejected (returns 400).
- Ordering: `(created DESC, id DESC)` throughout.

## Search Endpoint (`GET /search`)

- `type=posts`: full-text search on description and username; supports `q=#hashtag` to filter by hashtag (exact match via Meilisearch filter).
- `type=users`: full-text search on username and name.
- `type=hashtags`: full-text search on name.
- Cursor encodes a Meilisearch offset (base64-encoded integer string); page size is 20.
- Returns 503 if Meilisearch is not configured.
- Query must be 1–50 UTF-8 runes.

## Email Field Visibility

`email` is stripped from user responses unless the requester's `userID` matches the user's `id`.
