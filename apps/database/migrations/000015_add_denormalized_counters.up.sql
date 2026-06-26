ALTER TABLE posts
  ADD COLUMN like_count int NOT NULL DEFAULT 0,
  ADD COLUMN comment_count int NOT NULL DEFAULT 0;

UPDATE posts SET
  like_count    = (SELECT count(*) FROM likes    WHERE post_id = posts.id),
  comment_count = (SELECT count(*) FROM comments WHERE post_id = posts.id);

ALTER TABLE users
  ADD COLUMN post_count int NOT NULL DEFAULT 0;

UPDATE users SET
  post_count = (SELECT count(*) FROM posts WHERE user_id = users.id);

ALTER TABLE hashtags
  ADD COLUMN post_count int NOT NULL DEFAULT 0;

UPDATE hashtags SET
  post_count = (SELECT count(*) FROM post_hashtags WHERE hashtag_id = hashtags.id);
