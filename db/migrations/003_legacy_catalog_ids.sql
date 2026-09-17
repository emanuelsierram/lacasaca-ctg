ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE variants ADD COLUMN IF NOT EXISTS legacy_id text;
CREATE UNIQUE INDEX IF NOT EXISTS products_legacy_id_idx ON products (legacy_id) WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS variants_legacy_id_idx ON variants (legacy_id) WHERE legacy_id IS NOT NULL;
