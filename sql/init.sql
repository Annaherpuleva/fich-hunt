-- Base SQL bootstrap for local development.
-- Drizzle migrations should be applied after container start.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional app role for least-privilege local experiments.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'fich_hunt_app') THEN
    CREATE ROLE fich_hunt_app LOGIN PASSWORD 'fich_hunt_app';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE fich_hunt TO fich_hunt_app;
