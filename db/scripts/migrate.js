require('dotenv').config({ path: require('path').resolve(__dirname, '../../backend/.env') });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});
const migrationDirectory = path.resolve(__dirname, '../migrations');

async function migrate() {
  await client.connect();
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  await client.query('ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum text');
  for (const file of fs.readdirSync(migrationDirectory).filter((entry) => entry.endsWith('.sql')).sort()) {
    const sql = fs.readFileSync(path.join(migrationDirectory, file), 'utf8');
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');
    const applied = await client.query('SELECT checksum FROM schema_migrations WHERE version = $1', [file]);
    if (applied.rows[0]?.checksum === checksum) continue;
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2) ON CONFLICT (version) DO UPDATE SET checksum = EXCLUDED.checksum, applied_at = now()',
        [file, checksum]
      );
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