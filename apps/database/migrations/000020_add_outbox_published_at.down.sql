DROP INDEX outbox_published_at_idx;
ALTER TABLE outbox DROP COLUMN published_at;
