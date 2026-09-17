CREATE TABLE IF NOT EXISTS app_state (
  id integer PRIMARY KEY CHECK (id = 1),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);