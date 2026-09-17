UPDATE variants
SET attributes = attributes || '{"version": "Fan", "tournament": "Mundial"}'::jsonb
WHERE legacy_id = 'var-3';
