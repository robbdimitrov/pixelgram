CREATE TABLE sessions (
  id varchar(255) PRIMARY KEY,
  user_id integer REFERENCES users ON DELETE CASCADE,
  created timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

