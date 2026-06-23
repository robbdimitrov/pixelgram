CREATE TABLE outbox (
  id bigserial PRIMARY KEY,
  topic varchar(50) NOT NULL,
  payload jsonb NOT NULL,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX outbox_created_idx ON outbox(created);
