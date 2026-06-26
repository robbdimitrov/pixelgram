ALTER TABLE comments ADD COLUMN public_id uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX comments_public_id_idx ON comments(public_id);
