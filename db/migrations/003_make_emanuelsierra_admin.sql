UPDATE users
SET role = 'ADMIN'::user_role
WHERE lower(email) = lower('emanuelsierra17@gmail.com');

UPDATE app_state
SET data = jsonb_set(
	data,
	'{users}',
	(
		SELECT COALESCE(jsonb_agg(
			CASE
				WHEN lower(user_data->>'email') = lower('emanuelsierra17@gmail.com')
					THEN jsonb_set(user_data, '{role}', '"ADMIN"'::jsonb)
				ELSE user_data
			END
		), '[]'::jsonb)
		FROM jsonb_array_elements(COALESCE(data->'users', '[]'::jsonb)) AS user_data
	),
	true
)
WHERE id = 1 AND jsonb_typeof(data->'users') = 'array';
