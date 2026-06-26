ALTER TABLE sessions     ALTER COLUMN user_id     TYPE bigint;
ALTER TABLE uploads      ALTER COLUMN user_id     TYPE bigint;
ALTER TABLE posts        ALTER COLUMN user_id     TYPE bigint;
ALTER TABLE likes        ALTER COLUMN post_id     TYPE bigint,
                         ALTER COLUMN user_id     TYPE bigint;
ALTER TABLE comments     ALTER COLUMN post_id     TYPE bigint,
                         ALTER COLUMN user_id     TYPE bigint;
ALTER TABLE post_hashtags ALTER COLUMN post_id    TYPE bigint,
                          ALTER COLUMN hashtag_id TYPE bigint;
ALTER TABLE follows      ALTER COLUMN follower_id  TYPE bigint,
                         ALTER COLUMN followee_id  TYPE bigint;
ALTER TABLE audit_log    ALTER COLUMN user_id      TYPE bigint;
