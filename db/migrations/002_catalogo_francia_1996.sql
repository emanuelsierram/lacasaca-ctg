INSERT INTO products (legacy_id, slug, name, description, category_id, availability_type, is_active)
SELECT 'prod-023', 'francia-1996', 'Francia 1996', 'Camiseta retro Francia 1996', c.id, 'MADE_TO_ORDER', true
FROM categories c
WHERE c.name = 'RETROS'::product_category
  AND NOT EXISTS (
    SELECT 1
    FROM products p
    WHERE p.legacy_id = 'prod-023'
  );


INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT p.id, seed.image_url, p.name, seed.sort_order
FROM products p
JOIN (VALUES
  ('https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Selecciones/Francia/francia-1996/francia-1996.jpg', 1),
  ('https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Selecciones/Francia/francia-1996/francia-1996-front.jpg', 2),
  ('https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Selecciones/Francia/francia-1996/francia-1996-back.jpg', 3),
  ('https://aegyhqfzatbtsjafnhei.supabase.co/storage/v1/object/public/product-images/Retros/Selecciones/Francia/francia-1996/francia-1996-shield.jpg', 4)
) AS seed(image_url, sort_order) ON TRUE
WHERE p.legacy_id = 'prod-023'
ON CONFLICT (product_id, image_url) DO NOTHING;