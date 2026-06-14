CREATE TABLE comments (
  id        serial PRIMARY KEY,
  post_id  integer NOT NULL REFERENCES posts ON DELETE CASCADE,
  user_id   integer NOT NULL REFERENCES users  ON DELETE CASCADE,
  body      varchar(400) NOT NULL CHECK (char_length(body) > 0),
  created   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_post_id_idx ON comments(post_id);
