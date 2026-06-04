ALTER INDEX comments_post_id_idx RENAME TO comments_image_id_idx;
ALTER TABLE comments RENAME COLUMN post_id TO image_id;
ALTER TABLE likes RENAME COLUMN post_id TO image_id;
ALTER TABLE posts RENAME TO images;
