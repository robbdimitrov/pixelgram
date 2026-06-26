ALTER TABLE audit_log    ALTER COLUMN user_id      TYPE integer;
ALTER TABLE follows      ALTER COLUMN followee_id  TYPE integer,
                         ALTER COLUMN follower_id  TYPE integer;
ALTER TABLE post_hashtags ALTER COLUMN hashtag_id TYPE integer,
                          ALTER COLUMN post_id    TYPE integer;
ALTER TABLE comments     ALTER COLUMN user_id     TYPE integer,
                         ALTER COLUMN post_id     TYPE integer;
ALTER TABLE likes        ALTER COLUMN user_id     TYPE integer,
                         ALTER COLUMN post_id     TYPE integer;
ALTER TABLE posts        ALTER COLUMN user_id     TYPE integer;
ALTER TABLE uploads      ALTER COLUMN user_id     TYPE integer;
ALTER TABLE sessions     ALTER COLUMN user_id     TYPE integer;
