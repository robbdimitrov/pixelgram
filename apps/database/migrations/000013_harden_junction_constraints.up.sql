ALTER TABLE posts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE uploads ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE likes ALTER COLUMN post_id SET NOT NULL;
ALTER TABLE likes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE follows ALTER COLUMN follower_id SET NOT NULL;
ALTER TABLE follows ALTER COLUMN followee_id SET NOT NULL;
ALTER TABLE post_hashtags ALTER COLUMN post_id SET NOT NULL;
ALTER TABLE post_hashtags ALTER COLUMN hashtag_id SET NOT NULL;

ALTER TABLE likes DROP CONSTRAINT likes_post_id_user_id_key;
ALTER TABLE likes ADD PRIMARY KEY (post_id, user_id);

ALTER TABLE follows DROP CONSTRAINT follows_follower_id_followee_id_key;
ALTER TABLE follows ADD PRIMARY KEY (follower_id, followee_id);

ALTER TABLE post_hashtags DROP CONSTRAINT post_hashtags_post_id_hashtag_id_key;
ALTER TABLE post_hashtags ADD PRIMARY KEY (post_id, hashtag_id);
