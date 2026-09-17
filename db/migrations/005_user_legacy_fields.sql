ALTER TABLE users ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Usuario';
ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_id text;
CREATE UNIQUE INDEX IF NOT EXISTS users_legacy_id_unique ON users (legacy_id);
