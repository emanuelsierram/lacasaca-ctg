UPDATE variants
SET attributes = attributes || CASE legacy_id
  WHEN 'var-1' THEN '{"long-sleeves": false, "tournament": "LaLiga", "dorsal": "10"}'::jsonb
  WHEN 'var-2' THEN '{"long-sleeves": false, "tournament": "LaLiga", "dorsal": "10"}'::jsonb
  WHEN 'var-3' THEN '{"long-sleeves": false, "tournament": "Copa del Mundo 1986", "dorsal": "10"}'::jsonb
  ELSE '{}'::jsonb
END
WHERE legacy_id IN ('var-1', 'var-2', 'var-3');
