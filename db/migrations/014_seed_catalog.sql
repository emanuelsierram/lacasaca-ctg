INSERT INTO products (legacy_id, slug, name, description, category_id, availability_type, is_active, featured_image)
SELECT seed.legacy_id, seed.slug, seed.name, seed.description, c.id, seed.availability_type::availability_type, true, seed.featured_image
FROM (VALUES
  ('prod-1', 'barcelona-2024', 'Camiseta FC Barcelona 2024', 'Estandar para partido y entrenamiento.', 'ACTUALES', 'IMMEDIATE', 'https://images.example.com/barca.jpg'),
  ('prod-2', 'argentina-1986', 'Camiseta Argentina Retro 1986', 'Version clasica de la seleccion.', 'RETROS', 'MADE_TO_ORDER', 'https://images.example.com/argentina.jpg'),
  ('prod-3', 'camiseta-real-madrid-2025', 'Camiseta Real Madrid 2025', 'Camiseta blanca de competicion.', 'ACTUALES', 'IMMEDIATE', ''),
  ('prod-4', 'camiseta-manchester-city-2025', 'Camiseta Manchester City 2025', 'Diseno celeste de temporada.', 'ACTUALES', 'IMMEDIATE', ''),
  ('prod-5', 'camiseta-brasil-2024', 'Camiseta Brasil 2024', 'La clasica canarinha.', 'SELECCIONES', 'IMMEDIATE', ''),
  ('prod-6', 'camiseta-mexico-2024', 'Camiseta Mexico 2024', 'Verde de la seleccion mexicana.', 'SELECCIONES', 'IMMEDIATE', ''),
  ('prod-7', 'camiseta-milan-retro-1994', 'Camiseta Milan Retro 1994', 'Un clasico rossonero.', 'RETROS', 'IMMEDIATE', ''),
  ('prod-8', 'camiseta-colombia-femenina', 'Camiseta Colombia Femenina', 'Orgullo tricolor para ellas.', 'FEMENINO', 'IMMEDIATE', ''),
  ('prod-9', 'camiseta-argentina-mundial', 'Camiseta Argentina Mundial', 'La albiceleste campeona.', 'SELECCIONES', 'IMMEDIATE', ''),
  ('prod-10', 'camiseta-portugal-personalizada', 'Camiseta Portugal Personalizada', 'Diseno personalizado de Portugal.', 'SELECCIONES', 'MADE_TO_ORDER', ''),
  ('prod-11', 'camiseta-japon-edicion-especial', 'Camiseta Japon Edicion Especial', 'Edicion especial bajo pedido.', 'ACTUALES', 'MADE_TO_ORDER', ''),
  ('prod-12', 'camiseta-nigeria-fan-edition', 'Camiseta Nigeria Fan Edition', 'Modelo fan bajo pedido.', 'SELECCIONES', 'MADE_TO_ORDER', '')
) AS seed(legacy_id, slug, name, description, category, availability_type, featured_image)
JOIN categories c ON c.name = seed.category::product_category
ON CONFLICT DO NOTHING;

INSERT INTO variants (legacy_id, product_id, sku, attributes, price, stock, is_active, availability_type)
SELECT seed.legacy_id, p.id, seed.sku, seed.attributes::jsonb, seed.price, seed.stock, true, seed.availability_type::availability_type
FROM (VALUES
  ('var-1', 'prod-1', 'BAR-2024-M', '{"size":"M","version":"Home","long-sleeves":false,"tournament":"LaLiga","dorsal":"10"}', 129.99, 12, 'IMMEDIATE'),
  ('var-2', 'prod-1', 'BAR-2024-L', '{"size":"L","version":"Home","long-sleeves":false,"tournament":"LaLiga","dorsal":"10"}', 129.99, 0, 'IMMEDIATE'),
  ('var-3', 'prod-2', 'ARG-86-M', '{"size":"M","version":"Fan","long-sleeves":false,"tournament":"Mundial","dorsal":"10"}', 149.00, 4, 'MADE_TO_ORDER'),
  ('var-prod-3', 'prod-3', 'RM-2025', '{"size":"M","version":"Player","long-sleeves":false}', 119.99, 18, 'IMMEDIATE'),
  ('var-prod-4', 'prod-4', 'MC-2025', '{"size":"L","version":"Player","long-sleeves":false}', 114.99, 10, 'IMMEDIATE'),
  ('var-prod-5', 'prod-5', 'BRA-2024', '{"size":"M","version":"Player","long-sleeves":false}', 109.99, 8, 'IMMEDIATE'),
  ('var-prod-6', 'prod-6', 'MEX-2024', '{"size":"S","version":"Player","long-sleeves":false}', 104.99, 6, 'IMMEDIATE'),
  ('var-prod-7', 'prod-7', 'MIL-94', '{"size":"XL","version":"Player","long-sleeves":false}', 139.99, 4, 'IMMEDIATE'),
  ('var-prod-8', 'prod-8', 'COL-F-2025', '{"size":"M","version":"Player","long-sleeves":false}', 99.99, 9, 'IMMEDIATE'),
  ('var-prod-9', 'prod-9', 'ARG-WC', '{"size":"L","version":"Player","long-sleeves":false}', 129.99, 12, 'IMMEDIATE'),
  ('var-prod-10', 'prod-10', 'POR-CUSTOM', '{"size":"","version":"Fan","long-sleeves":false}', 119.99, 0, 'MADE_TO_ORDER'),
  ('var-prod-11', 'prod-11', 'JPN-SPECIAL', '{"size":"","version":"Fan","long-sleeves":false}', 124.99, 0, 'MADE_TO_ORDER'),
  ('var-prod-12', 'prod-12', 'NGA-FAN', '{"size":"","version":"Fan","long-sleeves":false}', 114.99, 0, 'MADE_TO_ORDER')
) AS seed(legacy_id, product_legacy_id, sku, attributes, price, stock, availability_type)
JOIN products p ON p.legacy_id = seed.product_legacy_id
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, image_url, sort_order)
SELECT p.id, p.featured_image, 0
FROM products p
WHERE p.featured_image IS NOT NULL AND p.featured_image <> ''
ON CONFLICT (product_id, image_url) DO NOTHING;
