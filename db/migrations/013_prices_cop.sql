UPDATE variants v
SET price = CASE
  WHEN c.name IN ('RETROS', 'NINOS') THEN 120000
  ELSE 80000
END,
updated_at = now()
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE v.product_id = p.id;
