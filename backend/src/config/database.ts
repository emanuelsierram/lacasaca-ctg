import dotenv from 'dotenv';
import { Pool } from 'pg';
import path from 'node:path';
import fs from 'node:fs/promises';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST ?? 'localhost',
      port: Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE ?? 'lacasaca',
      user: process.env.PGUSER ?? 'postgres',
      password: process.env.PGPASSWORD ?? ''
    });

export async function initializeDatabase() {
  if (!process.env.DATABASE_URL && !process.env.PGPASSWORD) {
    throw new Error('PostgreSQL credentials are missing. Create backend/.env from backend/.env.example and set PGPASSWORD.');
  }
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const migrationCandidates = [
    path.resolve(process.cwd(), 'db', 'migrations'),
    path.resolve(__dirname, '../../../db/migrations')
  ];
  const migrationDirectory = migrationCandidates.find((candidate) => {
    try {
      return require('node:fs').existsSync(candidate);
    } catch {
      return false;
    }
  });
  if (!migrationDirectory) throw new Error('Migration directory not found');
  const migrationFiles = (await fs.readdir(migrationDirectory)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of migrationFiles) {
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
    if (applied.rowCount) continue;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(await fs.readFile(path.join(migrationDirectory, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export async function loadState<T>(fallback: T): Promise<T> {
  const result = await pool.query<{ data: T }>('SELECT data FROM app_state WHERE id = 1');
  return result.rows[0]?.data ?? fallback;
}

export async function saveState<T>(data: T) {
  await pool.query(
    `INSERT INTO app_state (id, data, updated_at) VALUES (1, $1::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(data)]
  );
}

export async function closeDatabase() {
  await pool.end();
}

export { pool };