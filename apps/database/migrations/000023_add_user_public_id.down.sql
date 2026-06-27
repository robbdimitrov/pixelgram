DROP INDEX IF EXISTS users_public_id_key;

ALTER TABLE users DROP COLUMN IF EXISTS public_id;
