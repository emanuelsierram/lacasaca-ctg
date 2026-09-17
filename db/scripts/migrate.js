require('dotenv').config({ path: require('path').resolve(__dirname, '../../backend/.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});
const migrationDirectory = path.resolve(__dirname, '../migrations');

async function migrate() {
  await client.connect();
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  for (const file of fs.readdirSync(migrationDirectory).filter((entry) => entry.endsWith('.sql')).sort()) {
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
    if (applied.rowCount) continue;
    await client.query('BEGIN');
    try {
      await client.query(fs.readFileSync(path.join(migrationDirectory, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
  await client.end();
}

migrate().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});