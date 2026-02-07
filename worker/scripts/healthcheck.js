const path = require('path');
const dotenv = require('dotenv');

// Attempt to load env file if one exists (optional in container environments)
const defaultEnvPath = path.resolve(__dirname, '../.env');
dotenv.config({
  path: process.env.WORKER_ENV_FILE || defaultEnvPath,
  override: false,
});

const pool = require('../../shared/config/database');

async function main() {
  try {
    await pool.query('SELECT 1');
    console.log('worker-ready');
    process.exit(0);
  } catch (error) {
    console.error('worker healthcheck failed', error.message);
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (_) {
      // ignore pool close errors
    }
  }
}

main();
