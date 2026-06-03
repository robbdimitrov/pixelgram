CREATE TABLE sessions (
  id varchar(255) PRIMARY KEY,
  user_id integer REFERENCES users ON DELETE CASCADE,
  created timestamp NOT NULL DEFAULT now(),
  expires_at timestamp NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE login_failures (
  key varchar(255) PRIMARY KEY,
  count integer NOT NULL,
  reset_at timestamp NOT NULL
);

CREATE INDEX login_failures_reset_at_idx ON login_failures(reset_at);
