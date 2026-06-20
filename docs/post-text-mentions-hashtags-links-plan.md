# Post Text Mentions, Hashtags, and Links

## Summary

- Support rich post captions first: `@user` typeahead, `#hashtag` typeahead, clickable mentions/tags, and safe external links.
- Render user bios with the same linkification for display, but do not add bio typeahead or include bios in hashtag result pages yet.
- Because nothing has shipped, update the existing database migrations directly instead of adding corrective migrations.

## Key Changes

- Database:
  - Update existing migrations to create `hashtags` and `post_hashtags` with the original schema.
  - Enable `pg_trgm` in the existing migration set.
  - Add a GIN trigram index on `hashtags.name` for hashtag suggestions.
  - Add indexes needed for exact hashtag post pages, especially `post_hashtags(hashtag_id, post_id)`.
- Backend:
  - Store normalized lowercase hashtag names without `#`.
  - On `POST /posts`, extract hashtags from `description` and write `hashtags`/`post_hashtags` in the same transaction as post creation.
  - Add `GET /users/search?q=` for `@user` suggestions.
  - Add `GET /hashtags/search?q=` for hashtag suggestions.
  - Add `GET /hashtags/{tag}/posts` returning the existing cursor-paginated post page shape.
- Frontend:
  - Add a shared text parser/linkifier for captions and bios:
    - `@username` links to `/@username`
    - `#tag` links to `/tags/tag`
    - `http://` and `https://` URLs open externally with `target="_blank"` and `rel="noopener noreferrer"`
  - Add post caption typeahead for `@` and `#` in the upload textarea.
  - Add `/tags/:tag` route using the existing feed layout and pagination.

## Behavior Rules

- Hashtags are extracted from post captions only in v1.
- Bios render clickable mentions, hashtags, and URLs, but bio hashtags do not populate hashtag pages.
- Hashtag matching is case-insensitive and stored lowercase.
- Hashtag syntax: `#` followed by `a-z`, `0-9`, or `_`, length 1-50.
- Mention syntax follows existing username rules: `@` plus `a-z`, `0-9`, `.`, or `_`, length 3-30.
- Hashtag pages list posts by newest first with existing cursor pagination.
- User-entered text must be rendered from escaped tokens and explicit Svelte link elements, not raw trusted HTML.

## Test Plan

- Backend:
  - Hashtag extraction normalizes case, deduplicates tags, and ignores invalid tokens.
  - Post creation writes tag rows and join rows transactionally.
  - Hashtag post endpoint paginates correctly.
  - User and hashtag suggestion endpoints validate query length and return bounded results.
- Frontend:
  - Linkifier emits correct mention, hashtag, URL, and plain-text tokens.
  - Unsafe/non-http URLs remain plain text.
  - Caption and bio rendering preserves whitespace and does not inject raw HTML.
  - Tag route calls the hashtag posts endpoint and resets pagination on route change.
- Run `make test` and `npm run test` from `apps/frontend`.

## Assumptions

- Existing migrations may be rewritten because the app has not shipped and there is no applied production history to preserve.
- Future Meilisearch can consume the normalized hashtag data later; Postgres remains the source of truth for v1 hashtag pages.
