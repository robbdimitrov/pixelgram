CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE users (
  id serial PRIMARY KEY,
  public_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  username varchar(30) UNIQUE NOT NULL
    CHECK (username ~ '^[a-z0-9._]{3,30}$'),
  email varchar(255) UNIQUE NOT NULL,
  password varchar(255) NOT NULL,
  avatar varchar(255) DEFAULT '',
  bio varchar(300) DEFAULT '',
  follower_count int NOT NULL DEFAULT 0,
  post_count int NOT NULL DEFAULT 0,
  is_celebrity boolean NOT NULL DEFAULT false,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_username_trgm_idx ON users USING gin (username gin_trgm_ops);
CREATE INDEX users_is_celebrity_idx ON users (is_celebrity) WHERE is_celebrity = true;
