CREATE TABLE uploads (
  filename varchar(255) PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX uploads_user_id_idx ON uploads(user_id);
CREATE INDEX uploads_created_idx ON uploads(created);

CREATE TABLE posts (
  id serial PRIMARY KEY,
  public_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  filename varchar(255) NOT NULL,
  description varchar(1000),
  like_count int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE likes (
  post_id bigint NOT NULL REFERENCES posts ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  created timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX posts_created_id_idx ON posts (created DESC, id DESC);
CREATE INDEX posts_user_id_created_id_idx ON posts (user_id, created DESC, id DESC);
CREATE INDEX likes_user_id_created_post_id_idx ON likes (user_id, created DESC, post_id DESC);
CREATE INDEX posts_filename_idx ON posts(filename) WHERE filename IS NOT NULL;
