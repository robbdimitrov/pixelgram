ALTER TABLE users
  ADD COLUMN public_id UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX users_public_id_key ON users (public_id);
