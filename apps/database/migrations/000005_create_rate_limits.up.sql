CREATE UNLOGGED TABLE rate_limits (
  id           TEXT        PRIMARY KEY,
  tokens       INTEGER     NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);
