# Data Model

## Entities and Relationships

```
users ──< sessions
users ──< uploads
users ──< posts ──< likes
                 ──< comments
                 ──< post_hashtags >── hashtags
users ──< follows (follower → followee)
search_outbox (event queue for Meilisearch sync)
```

## Entity Definitions

### users
| Field | Type | Constraints |
|---|---|---|
| id | serial PK | auto-increment |
| name | varchar(255) | NOT NULL |
| username | varchar(30) | UNIQUE, NOT NULL, CHECK `^[a-z0-9._]{3,30}$` |
| email | varchar(255) | UNIQUE, NOT NULL |
| password | varchar(255) | NOT NULL — Argon2id PHC hash |
| avatar | varchar(255) | DEFAULT `''` — blob filename |
| bio | varchar(300) | DEFAULT `''` |
| created | timestamptz | DEFAULT now() |

### sessions
| Field | Type | Constraints |
|---|---|---|
| id | varchar(255) PK | Private HMAC-SHA256 hash of the raw session token; never exposed |
| public_id | uuid | UNIQUE, NOT NULL, DEFAULT gen_random_uuid() — listing and revocation identifier |
| user_id | integer FK → users | NOT NULL, ON DELETE CASCADE |
| created | timestamptz | NOT NULL |
| expires_at | timestamptz | NOT NULL |

### uploads
Staging table for image blobs before they become a post or avatar. A row is consumed (deleted) atomically when a post or avatar update references it.

| Field | Type | Constraints |
|---|---|---|
| filename | varchar(255) PK | 32-char lowercase hex |
| user_id | integer FK → users | ON DELETE CASCADE |
| created | timestamptz | NOT NULL |

### posts
| Field | Type | Constraints |
|---|---|---|
| id | serial PK | |
| public_id | uuid UNIQUE | DEFAULT gen_random_uuid() — external identifier |
| user_id | integer FK → users | ON DELETE CASCADE |
| filename | varchar(255) | NOT NULL — blob filename |
| description | varchar(1000) | nullable |
| created | timestamptz | NOT NULL |

### likes
| Field | Type | Constraints |
|---|---|---|
| post_id | integer FK → posts | ON DELETE CASCADE |
| user_id | integer FK → users | ON DELETE CASCADE |
| created | timestamptz | NOT NULL |
| — | UNIQUE(post_id, user_id) | |

### comments
| Field | Type | Constraints |
|---|---|---|
| id | serial PK | |
| post_id | integer FK → posts | ON DELETE CASCADE |
| user_id | integer FK → users | ON DELETE CASCADE |
| body | varchar(400) | CHECK char_length > 0 |
| created | timestamptz | NOT NULL |

### hashtags
| Field | Type | Constraints |
|---|---|---|
| id | serial PK | |
| name | varchar(50) UNIQUE | NOT NULL — lowercase |
| created | timestamptz | NOT NULL |

### post_hashtags
| Field | Type | Constraints |
|---|---|---|
| post_id | integer FK → posts | ON DELETE CASCADE |
| hashtag_id | integer FK → hashtags | ON DELETE CASCADE |
| created | timestamptz | NOT NULL |
| — | UNIQUE(post_id, hashtag_id) | |

### follows
| Field | Type | Constraints |
|---|---|---|
| follower_id | integer FK → users | ON DELETE CASCADE |
| followee_id | integer FK → users | ON DELETE CASCADE |
| created | timestamptz | NOT NULL |
| — | UNIQUE(follower_id, followee_id) | |

### search_outbox
Transactional outbox. Written in the same transaction as the entity mutation; read by the search worker.

| Field | Type | Constraints |
|---|---|---|
| id | serial PK | |
| entity_type | varchar(20) | `user`, `post`, or `hashtag` |
| entity_id | varchar(255) | user id (int as text), post public_id (UUID), or hashtag name |
| attempts | integer | DEFAULT 0 — retry counter; dead-lettered (deleted) at 5 |
| created | timestamptz | NOT NULL |

## Indexes

| Table | Index | Purpose |
|---|---|---|
| sessions | sessions_public_id_key (UNIQUE) | public session lookup and revocation |
| sessions | sessions_user_id_idx | session lookup by user |
| sessions | sessions_expires_at_idx | cleanup sweep |
| uploads | uploads_user_id_idx, uploads_created_idx | expiry queries |
| posts | posts_created_id_idx | feed pagination |
| posts | posts_user_id_created_id_idx | profile pagination |
| likes | likes_user_id_created_post_id_idx | liked posts pagination |
| comments | comments_post_id_created_id_idx | comment pagination |
| follows | follows_follower_id_idx, follows_followee_id_idx | social graph traversal |
| hashtags | hashtags_name_trgm_idx (GIN trgm) | trigram typeahead |
| users | users_username_trgm_idx (GIN trgm) | trigram typeahead |
| search_outbox | search_outbox_id_idx | worker batch ordering |

## Meilisearch Indexes

| Index | Searchable | Filterable | Sortable | Primary key |
|---|---|---|---|---|
| users | username, name | — | — | id (string, stringified int) |
| posts | description, username | hashtags | created | id (post public_id UUID) |
| hashtags | name | — | post_count | id (hashtag name) |

## Domain Invariants

- A post's `filename` is consumed from `uploads` atomically at creation; an orphaned upload is never used for a post.
- A user's `avatar` must either be blank, equal to an existing `users.avatar` or `posts.filename` owned by the same user, or a valid pending `upload`. The old avatar blob is deleted from object storage if no other entity references it.
- Deleting a post clears `users.avatar` for any user whose avatar references the post's filename.
- A session token is stored only as its private HMAC-SHA256 `id`; the raw token
  lives only in the cookie. The independent UUID `public_id` is safe to expose
  for session listing and ownership-constrained revocation.
- Session creation is serialized on the owning user row and retains at most the
  100 newest sessions per user.
- Hashtag names are lowercased and de-duplicated before storage; they are created idempotently (`ON CONFLICT DO NOTHING`).
- `follows(follower_id, followee_id)` is inserted with `ON CONFLICT DO NOTHING`; self-follow is blocked at the service layer.
