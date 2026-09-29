ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS attributes jsonb;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}'::jsonb;
