DROP INDEX IF EXISTS products_legacy_id_idx;
DROP INDEX IF EXISTS variants_legacy_id_idx;
CREATE UNIQUE INDEX IF NOT EXISTS products_legacy_id_unique ON products (legacy_id);
CREATE UNIQUE INDEX IF NOT EXISTS variants_legacy_id_unique ON variants (legacy_id);