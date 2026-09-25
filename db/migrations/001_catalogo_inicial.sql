CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE product_category AS ENUM ('RETROS', 'ACTUALES', 'SELECCIONES', 'FEMENINO', 'NINOS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE availability_type AS ENUM ('IMMEDIATE', 'MADE_TO_ORDER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CUSTOMER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('CASH_ON_DELIVERY', 'WHATSAPP_TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDIENTE', 'CONFIRMADO', 'RECHAZADO', 'EXPIRADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS app_state (
  id integer PRIMARY KEY CHECK (id = 1),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name product_category NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id),
  availability_type availability_type NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  legacy_id text
);

CREATE UNIQUE INDEX IF NOT EXISTS products_legacy_id_unique ON products (legacy_id);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, image_url)
);

CREATE INDEX IF NOT EXISTS product_images_product_order_idx
  ON product_images (product_id, sort_order, created_at);

CREATE TABLE IF NOT EXISTS variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  sku text NOT NULL UNIQUE,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  price numeric(12,2) NOT NULL CHECK (price > 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active boolean NOT NULL DEFAULT true,
  availability_type availability_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  legacy_id text
);

CREATE UNIQUE INDEX IF NOT EXISTS variants_legacy_id_unique ON variants (legacy_id);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL DEFAULT 'Usuario',
  legacy_id text,
  address text NOT NULL DEFAULT ''
);

CREATE UNIQUE INDEX IF NOT EXISTS users_legacy_id_unique ON users (legacy_id);

CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  guest_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  legacy_id text,
  CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS carts_legacy_id_unique ON carts (legacy_id);

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES variants(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_snapshot numeric(12,2) NOT NULL CHECK (unit_price_snapshot > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  legacy_id text,
  UNIQUE (cart_id, variant_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS cart_items_legacy_id_unique ON cart_items (legacy_id);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'PENDIENTE',
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'PENDIENTE',
  total numeric(12,2) NOT NULL CHECK (total > 0),
  shipping_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  legacy_id text,
  customer_phone text
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_legacy_id_unique ON orders (legacy_id);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES variants(id),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_snapshot numeric(12,2) NOT NULL CHECK (unit_price_snapshot > 0),
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  method payment_method NOT NULL,
  external_reference text,
  status payment_status NOT NULL DEFAULT 'PENDIENTE',
  confirmation_by_user_id uuid REFERENCES users(id),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  legacy_id text,
  UNIQUE (external_reference)
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_legacy_id_unique ON payments (legacy_id);

CREATE TABLE IF NOT EXISTS admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id, expires_at);

TRUNCATE TABLE app_state, cart_items, carts, payments, order_items, orders,
  admin_action_logs, password_reset_tokens, variants, products, users, categories
  RESTART IDENTITY CASCADE;

INSERT INTO users (legacy_id, name, email, password_hash, role, address)
VALUES
  ('admin-1', 'Administrador', 'emanuelsierra17@gmail.com', 'hash:QWRtaW4xMjMh', 'ADMIN', ''),
  ('customer-1', 'Cliente', 'cliente@lacasaca.com', 'hash:Q3VzdG9tZXIxMjMh', 'CUSTOMER', '');

INSERT INTO categories (name, slug)
VALUES
  ('RETROS', 'retros'),
  ('ACTUALES', 'actuales'),
  ('SELECCIONES', 'selecciones'),
  ('FEMENINO', 'femenino'),
  ('NINOS', 'ninos');

INSERT INTO products (legacy_id, slug, name, description, category_id, availability_type, is_active)
SELECT seed.legacy_id, seed.slug, seed.name, 'Camiseta disponible para entrega inmediata.', c.id, 'IMMEDIATE', true
FROM (VALUES
  ('prod-001', 'colombia-mundial-2026-femenino', 'Colombia Mundial 2026 Femenino', 'FEMENINO'),
  ('prod-002', 'santos-2012-neymar-11', 'Santos 2012 Neymar #11', 'RETROS'),
  ('prod-003', 'manchester-2008-cristiano-ronaldo-7', 'Manchester 2008 Cristiano Ronaldo #7', 'RETROS'),
  ('prod-004', 'barcelona-2025-26', 'Barcelona 2025/26', 'ACTUALES'),
  ('prod-005', 'colombia-mundial-2026', 'Colombia Mundial 2026', 'SELECCIONES'),
  ('prod-006', 'colombia-aniversario-100', 'Colombia Aniversario 100 años', 'FEMENINO'),
  ('prod-007', 'ac-milan-2007-kaka-22', 'AC Milan 2007 Kaká #22', 'RETROS'),
  ('prod-008', 'atletico-de-madrid-2012-falcao-9', 'Atletico de Madrid 2012 Falcao #9', 'RETROS'),
  ('prod-009', 'atletico-nacional-2026', 'Atletico Nacional 2026', 'ACTUALES'),
  ('prod-010', 'juventus-2014-15', 'Juventus 2014/15', 'RETROS'),
  ('prod-011', 'portugal-mundial-2026', 'Portugal Mundial 2026 Cristiano Ronaldo #7', 'SELECCIONES'),
  ('prod-012', 'brasil-mundial-2026-neymar-10', 'Brasil Mundial 2026 Neymar #10', 'SELECCIONES'),
  ('prod-013', 'argentina-mundial', 'Argentina Mundial 2026 Messi #10', 'SELECCIONES'),
  ('prod-014', 'fc-barcelona-2026-27', 'FC Barcelona 2026/27', 'ACTUALES'),
  ('prod-015', 'real-madrid-2026-27', 'Real Madrid 2026/27', 'ACTUALES'),
  ('prod-016', 'colombia-aniversario-100-kids', 'Colombia Aniversario 100 Kids', 'NINOS'),
  ('prod-017', 'fc-barcelona-2026-27-away', 'FC Barcelona 2026/27 Away', 'ACTUALES'),
  ('prod-020', 'bayern-munich-2026-27-away', 'Bayern Munich 2026/27 Luis Diaz #14', 'ACTUALES'),
  ('prod-021', 'colombia-1994', 'Colombia 1994', 'RETROS'),
  ('prod-022', 'real-madrid-2026-27-away', 'Real Madrid 2026/27 Away', 'ACTUALES')
) AS seed(legacy_id, slug, name, category)
JOIN categories c ON c.name = seed.category::product_category;

INSERT INTO variants (legacy_id, product_id, sku, attributes, price, stock, is_active, availability_type)
SELECT seed.legacy_id, p.id, seed.sku, seed.attributes::jsonb, seed.price, seed.stock, true, 'IMMEDIATE'
FROM (VALUES
  ('var-001', 'prod-001', 'COL-MUNDIAL-F-M-PLAYER', '{"size":"M","version":"PLAYER"}', 60000, 1),
  ('var-002', 'prod-001', 'COL-MUNDIAL-F-L-FAN', '{"size":"L","version":"FAN"}', 60000, 1),
  ('var-003', 'prod-001', 'COL-MUNDIAL-F-XL-PLAYER', '{"size":"XL","version":"FAN"}', 60000, 1),
  ('var-004', 'prod-002', 'SAN-2012-NEYMAR-M-FAN', '{"size":"M","version":"FAN","dorsal":"#11 Neymar"}', 140000, 1),
  ('var-005', 'prod-003', 'MAN-2008-CR7-M-FAN', '{"size":"M","version":"FAN","dorsal":"#7 Ronaldo","tournament":"Champions League"}', 140000, 1),
  ('var-006', 'prod-003', 'MAN-2008-CR7-L-FAN', '{"size":"L","version":"FAN","dorsal":"#7 Ronaldo"}', 140000, 1),
  ('var-007', 'prod-004', 'BAR-2025-26-M-FAN', '{"size":"M","version":"FAN"}', 60000, 1),
  ('var-008', 'prod-005', 'COL-MUNDIAL-S-L-FAN', '{"size":"L","version":"FAN"}', 80000, 1),
  ('var-009', 'prod-006', 'COL-100-F-L-FAN', '{"size":"L","version":"FAN"}', 80000, 2),
  ('var-010', 'prod-006', 'COL-100-F-M-FAN', '{"size":"M","version":"FAN"}', 80000, 2),
  ('var-011', 'prod-006', 'COL-100-F-XL-FAN', '{"size":"XL","version":"FAN"}', 80000, 1),
  ('var-012', 'prod-007', 'MIL-2007-KAKA-L-FAN', '{"size":"L","version":"FAN","dorsal":"#22 Kaká","tournament":"Champions League"}', 140000, 1),
  ('var-013', 'prod-008', 'ATM-2012-FALCAO-L-FAN', '{"size":"L","version":"FAN","dorsal":"#9 Falcao","tournament":"Supercopa de Europa"}', 140000, 1),
  ('var-014', 'prod-009', 'ATN-2026-L-FAN', '{"size":"L","version":"FAN"}', 80000, 1),
  ('var-015', 'prod-010', 'JUV-2014-15-L-FAN', '{"size":"L","version":"FAN"}', 120000, 1),
  ('var-016', 'prod-011', 'POR-2026-CR7-2XL-PLAYER', '{"size":"2XL","version":"PLAYER","dorsal":"#7 Ronaldo"}', 100000, 1),
  ('var-017', 'prod-012', 'BRA-2026-NEYMAR-XL-PLAYER', '{"size":"XL","version":"PLAYER","dorsal":"#10 Neymar"}', 100000, 1),
  ('var-018', 'prod-013', 'ARG-2026-MESSI-XL-PLAYER', '{"size":"XL","version":"PLAYER","dorsal":"#10 Messi"}', 100000, 1),
  ('var-019', 'prod-014', 'BAR-2026-27-L-FAN', '{"size":"L","version":"FAN"}', 80000, 1),
  ('var-020', 'prod-015', 'RM-2026-27-L-FAN', '{"size":"L","version":"FAN"}', 80000, 1),
  ('var-021', 'prod-015', 'RM-2026-27-M-FAN', '{"size":"M","version":"FAN"}', 80000, 1),
  ('var-022', 'prod-016', 'COL-100-KIDS-16-FAN', '{"size":"16","version":"FAN"}', 110000, 1),
  ('var-023', 'prod-017', 'BAR-2026-27-AWAY-L-FAN', '{"size":"L","version":"FAN","tournament":"Champions League"}', 80000, 1),
  ('var-024', 'prod-017', 'BAR-2026-27-AWAY-L-PLAYER', '{"size":"L","version":"PLAYER","tournament":"Champions League"}', 80000, 1),
  ('var-025', 'prod-005', 'COL-2026-LUIS-DIAZ-XL-PLAYER', '{"size":"XL","version":"PLAYER","dorsal":"#7 Luis Díaz","tournament":"Mundial"}', 80000, 1),
  ('var-026', 'prod-015', 'RM-2027-MBAPPE-L-FAN', '{"size":"L","version":"FAN","dorsal":"#10 Mbappe","tournament":"Champions League"}', 80000, 1),
  ('var-027', 'prod-015', 'RM-2027-MBAPPE-M-FAN', '{"size":"M","version":"FAN","dorsal":"#10 Mbappe","tournament":"Champions League"}', 80000, 1),
  ('var-028', 'prod-020', 'BAY-2026-27-LUIS-DIAZ-L-FAN', '{"size":"L","version":"FAN","dorsal":"#14 Luis Díaz"}', 100000, 1),
  ('var-029', 'prod-021', 'COL-1994-L-FAN', '{"size":"L","version":"FAN"}', 110000, 1),
  ('var-030', 'prod-022', 'RM-2026-27-AWAY-L-FAN', '{"size":"L","version":"FAN","tournament":"Champions League"}', 80000, 1)
) AS seed(legacy_id, product_legacy_id, sku, attributes, price, stock)
JOIN products p ON p.legacy_id = seed.product_legacy_id;

INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, seed.image_url, p.name, seed.sort_order
FROM (VALUES
  ('prod-001', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Femenino/Mundial/Colombia/colombia-mundial-2026-femenino/colombia-mundial-2026-femenino.jpg', 1),
  ('prod-001', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Femenino/Mundial/Colombia/colombia-mundial-2026-femenino/colombia-mundial-2026-femenino-back.jpg', 2),
  ('prod-002', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Brasileirao/santos-away-2012-neymar-11/santos-away-2012-neymar-11-front.jpeg', 1),
  ('prod-002', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Brasileirao/santos-away-2012-neymar-11/santos-away-2012-neymar-11-back.png', 2),
  ('prod-002', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Brasileirao/santos-away-2012-neymar-11/santos-away-2012-neymar-11-front2.jpeg', 3),
  ('prod-002', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Brasileirao/santos-away-2012-neymar-11/santos-away-2012-neymar-11-left.jpeg', 4),
  ('prod-002', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Brasileirao/santos-away-2012-neymar-11/santos-away-2012-neymar-11-shield.jpeg', 5),
  ('prod-003', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Premier/manchester-2008-cristiano-ronaldo-7/manchester-2008-cristiano-ronaldo-7.jpeg', 1),
  ('prod-003', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Premier/manchester-2008-cristiano-ronaldo-7/manchester-2008-cristiano-ronaldo-7-back.png', 2),
  ('prod-004', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/La%20Liga/barcelona-2025-26/fcbarcelona-front-2025-26.jpg', 1),
  ('prod-004', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/La%20Liga/barcelona-2025-26/fcbarcelona-back-2025-26.jpg', 2),
  ('prod-005', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Selecciones/Mundial/Colombia/colombia-mundial-2026/colombia-mundial-2026.jpg', 1),
  ('prod-005', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Selecciones/Mundial/Colombia/colombia-mundial-2026/colombia-mundial-2026-back.jpg', 2),
  ('prod-005', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Selecciones/Mundial/Colombia/colombia-mundial-2026/colombia-mundial-2026-back2.png', 3),
  ('prod-006', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Femenino/Eliminatorias/colombia-aniversario-100/colombia-100.women.jpeg', 1),
  ('prod-007', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Serie%20A/ac-milan-2007-kaka-22/ac-milan-2007-front.jpeg', 1),
  ('prod-007', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Serie%20A/ac-milan-2007-kaka-22/ac-milan-2007-front2.jpeg', 2),
  ('prod-007', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Serie%20A/ac-milan-2007-kaka-22/ac-milan-2007-back.png', 3),
  ('prod-008', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/La%20Liga/atletico-de-madrid-2012-falcao-9/atletico-de-madrid-2012-falcao-9.jpg', 1),
  ('prod-008', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/La%20Liga/atletico-de-madrid-2012-falcao-9/atletico-de-madrid-2012-falcao-9-front.jpg', 2),
  ('prod-008', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/La%20Liga/atletico-de-madrid-2012-falcao-9/atletico-de-madrid-2012-falcao-9-shield.jpg', 3),
  ('prod-008', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/La%20Liga/atletico-de-madrid-2012-falcao-9/atletico-de-madrid-2012-falcao-9-supercopa.jpg', 4),
  ('prod-008', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/La%20Liga/atletico-de-madrid-2012-falcao-9/atletico-de-madrid-2012-falcao-9-supercopa-back.jpg', 5),
  ('prod-008', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/La%20Liga/atletico-de-madrid-2012-falcao-9/atletico-de-madrid-2012-falcao-9-supercopa-left.jpg', 6),
  ('prod-009', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/Liga%20Colombiana/atletico-nacional-2026/atletico-nacional-2026.jpg', 1),
  ('prod-010', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Serie%20A/juventus-2014-15/juventus-2014-15.jpg', 1),
  ('prod-010', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Serie%20A/juventus-2014-15/juventus-2014-15-front.jpg', 2),
  ('prod-010', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Serie%20A/juventus-2014-15/juventus-2014-15-back.jpg', 3),
  ('prod-010', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Serie%20A/juventus-2014-15/juventus-2014-15-left.jpg', 4),
  ('prod-010', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Serie%20A/juventus-2014-15/juventus-2014-15-logo.jpg', 5),
  ('prod-010', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Serie%20A/juventus-2014-15/juventus-2014-15-scudetto.jpg', 6),
  ('prod-010', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Serie%20A/juventus-2014-15/juventus-2014-15-auth.jpg', 7),
  ('prod-011', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Selecciones/Mundial/Portugal/portugal-mundial-2026/portugal-mundial-2026-front.jpg', 1),
  ('prod-011', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Selecciones/Mundial/Portugal/portugal-mundial-2026/portugal-mundial-2026-back.png', 2),
  ('prod-012', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Selecciones/Mundial/Brasil/brasil-mundial-2026/brasil-mundial-2026-front.jpg', 1),
  ('prod-012', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Selecciones/Mundial/Brasil/brasil-mundial-2026/brasil-mundial-2026-back.png', 2),
  ('prod-013', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Selecciones/Mundial/Argentina/argentina-mundial-2026/argentina-mundial-2026-front.jpg', 1),
  ('prod-013', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Selecciones/Mundial/Argentina/argentina-mundial-2026/argentina-mundial-2026-back.png', 2),
  ('prod-014', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/La%20Liga/fc-barcelona-2026-27/fc-barcelona-2026-27-front.jpg', 1),
  ('prod-014', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/La%20Liga/fc-barcelona-2026-27/fc-barcelona-2026-27-back.jpg', 2),
  ('prod-015', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/La%20Liga/real-madrid-2026-27/real-madrid-2026-27-front.jpg', 1),
  ('prod-015', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/La%20Liga/real-madrid-2026-27/real-madrid-2026-27-mbappe.png', 2),
  ('prod-016', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Ninos/Selecciones/Colombia/colombia-aniversario-100-kids/colombia-aniversario-100-kids.jpg', 1),
  ('prod-017', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/La%20Liga/fc-barcelona-2026-27-away/fcbarcelona-away-front.jpg', 1),
  ('prod-017', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/La%20Liga/fc-barcelona-2026-27-away/fcbarcelona-away-back.jpg', 2),
  ('prod-020', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/Bundesliga/bayern-munich-2026-27-away/bayern-munich-2026-27-away-front.jpg', 1),
  ('prod-020', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/Bundesliga/bayern-munich-2026-27-away/bayern-munich-2026-27-away-back.png', 2),
  ('prod-021', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Selecciones/Colombia/colombia-1994/colombia-1994.jpg', 1),
  ('prod-021', 'URL_PROD_021_2', 2),
  ('prod-022', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/La%20Liga/real-madrid-2026-27-away/real-madrid-2026-27-away-front.jpeg', 1),
  ('prod-022', 'https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Actuales/La%20Liga/real-madrid-2026-27-away/real-madrid-2026-27-away-back.jpeg', 2)
) AS seed(product_legacy_id, image_url, sort_order)
JOIN products p ON p.legacy_id = seed.product_legacy_id;
