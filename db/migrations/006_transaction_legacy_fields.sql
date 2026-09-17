ALTER TABLE carts ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS legacy_id text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS legacy_id text;
CREATE UNIQUE INDEX IF NOT EXISTS carts_legacy_id_unique ON carts (legacy_id);
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_legacy_id_unique ON cart_items (legacy_id);
CREATE UNIQUE INDEX IF NOT EXISTS orders_legacy_id_unique ON orders (legacy_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_legacy_id_unique ON payments (legacy_id);
