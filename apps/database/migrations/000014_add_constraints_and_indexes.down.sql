DROP INDEX IF EXISTS posts_filename_idx;
DROP INDEX IF EXISTS notifications_user_id_unread_idx;

ALTER TABLE follows
  DROP CONSTRAINT IF EXISTS follows_no_self_follow;

ALTER TABLE notifications
  ALTER COLUMN type TYPE varchar(50);

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;
