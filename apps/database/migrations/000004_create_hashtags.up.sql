CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE hashtags (
  id serial PRIMARY KEY,
  name varchar(50) UNIQUE NOT NULL,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_hashtags (
  post_id integer REFERENCES posts ON DELETE CASCADE,
  hashtag_id integer REFERENCES hashtags ON DELETE CASCADE,
  created timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, hashtag_id)
);

CREATE INDEX post_hashtags_hashtag_id_idx ON post_hashtags(hashtag_id);
CREATE INDEX hashtags_name_trgm_idx ON hashtags USING gin (name gin_trgm_ops);
CREATE INDEX users_username_trgm_idx ON users USING gin (username gin_trgm_ops);
