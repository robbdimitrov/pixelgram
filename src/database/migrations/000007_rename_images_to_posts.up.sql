ALTER TABLE images RENAME TO posts;
ALTER TABLE likes RENAME COLUMN image_id TO post_id;
ALTER TABLE comments RENAME COLUMN image_id TO post_id;
ALTER INDEX comments_image_id_idx RENAME TO comments_post_id_idx;
