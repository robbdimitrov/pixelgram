CREATE TABLE follows (
  follower_id integer REFERENCES users ON DELETE CASCADE,
  followee_id integer REFERENCES users ON DELETE CASCADE,
  created timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, followee_id)
);

CREATE INDEX follows_follower_id_idx ON follows(follower_id);
CREATE INDEX follows_followee_id_idx ON follows(followee_id);
