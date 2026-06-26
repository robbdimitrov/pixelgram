ALTER TABLE post_hashtags DROP CONSTRAINT post_hashtags_pkey;
ALTER TABLE post_hashtags ADD CONSTRAINT post_hashtags_post_id_hashtag_id_key UNIQUE (post_id, hashtag_id);

ALTER TABLE follows DROP CONSTRAINT follows_pkey;
ALTER TABLE follows ADD CONSTRAINT follows_follower_id_followee_id_key UNIQUE (follower_id, followee_id);

ALTER TABLE likes DROP CONSTRAINT likes_pkey;
ALTER TABLE likes ADD CONSTRAINT likes_post_id_user_id_key UNIQUE (post_id, user_id);

ALTER TABLE post_hashtags ALTER COLUMN hashtag_id DROP NOT NULL;
ALTER TABLE post_hashtags ALTER COLUMN post_id DROP NOT NULL;
ALTER TABLE follows ALTER COLUMN followee_id DROP NOT NULL;
ALTER TABLE follows ALTER COLUMN follower_id DROP NOT NULL;
ALTER TABLE likes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE likes ALTER COLUMN post_id DROP NOT NULL;
ALTER TABLE uploads ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE posts ALTER COLUMN user_id DROP NOT NULL;
