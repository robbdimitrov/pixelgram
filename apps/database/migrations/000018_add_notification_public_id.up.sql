ALTER TABLE notifications ADD COLUMN public_id uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX notifications_public_id_idx ON notifications(public_id);
