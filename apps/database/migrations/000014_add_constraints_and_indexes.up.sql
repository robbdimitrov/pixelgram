-- M-23: enforce valid notification types at the database level
ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check CHECK (type IN ('like', 'comment', 'follow'));

ALTER TABLE notifications
  ALTER COLUMN type TYPE varchar(20);

-- M-24: prevent self-follows at the database level
ALTER TABLE follows
  ADD CONSTRAINT follows_no_self_follow CHECK (follower_id <> followee_id);

-- M-26: partial index for fast unread notification count per user
CREATE INDEX notifications_user_id_unread_idx
  ON notifications(user_id) WHERE read = false;

-- L-09: index for avatar cleanup check inside UpdateUser transactions
CREATE INDEX posts_filename_idx
  ON posts(filename) WHERE filename IS NOT NULL;
