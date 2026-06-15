CREATE INDEX posts_created_id_idx ON posts (created DESC, id DESC);
CREATE INDEX posts_user_id_created_id_idx ON posts (user_id, created DESC, id DESC);
CREATE INDEX likes_user_id_created_post_id_idx ON likes (user_id, created DESC, post_id DESC);
