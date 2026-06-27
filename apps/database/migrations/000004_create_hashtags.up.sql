CREATE TABLE hashtags (
  id serial PRIMARY KEY,
  name varchar(50) UNIQUE NOT NULL,
  post_count int NOT NULL DEFAULT 0,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_hashtags (
  post_id bigint NOT NULL REFERENCES posts ON DELETE CASCADE,
  hashtag_id bigint NOT NULL REFERENCES hashtags ON DELETE CASCADE,
  created timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, hashtag_id)
);

CREATE INDEX post_hashtags_hashtag_id_idx ON post_hashtags(hashtag_id);
CREATE INDEX hashtags_name_trgm_idx ON hashtags USING gin (name gin_trgm_ops);
