INSERT INTO product_images (product_id, image_url, sort_order)
SELECT p.id, p.featured_image, 0
FROM products p
WHERE p.featured_image IS NOT NULL AND p.featured_image <> ''
ON CONFLICT (product_id, image_url) DO NOTHING;

UPDATE products
SET featured_image = NULL
WHERE featured_image IS NOT NULL;
