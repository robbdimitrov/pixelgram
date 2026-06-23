ALTER TABLE users ADD COLUMN follower_count int NOT NULL DEFAULT 0;
UPDATE users SET follower_count = (
  SELECT COUNT(*) FROM follows WHERE followee_id = users.id
);
