CREATE TABLE sessions (
  id varchar(255) PRIMARY KEY,
  public_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  user_id integer NOT NULL REFERENCES users ON DELETE CASCADE,
  created timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);
