CREATE INDEX posts_created_idx ON posts (created DESC);
CREATE INDEX posts_user_id_created_idx ON posts (user_id, created DESC);
CREATE INDEX likes_user_id_created_idx ON likes (user_id, created DESC);
