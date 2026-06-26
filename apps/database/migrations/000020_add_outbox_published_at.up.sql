ALTER TABLE outbox ADD COLUMN published_at timestamptz;

CREATE INDEX outbox_published_at_idx ON outbox(published_at) WHERE published_at IS NULL;
