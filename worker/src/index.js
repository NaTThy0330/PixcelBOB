const path = require('path');
const dotenv = require('dotenv');
const { patchConsole } = require('../../shared/utils/logger');

const defaultEnvPath = path.resolve(__dirname, '../.env');
const resolvedEnvPath = process.env.WORKER_ENV_FILE
  ? path.resolve(process.cwd(), process.env.WORKER_ENV_FILE)
  : defaultEnvPath;

dotenv.config({ path: resolvedEnvPath });

patchConsole({
  serviceName: process.env.SERVICE_NAME || 'upload-worker',
  logLevel: process.env.LOG_LEVEL || 'info',
});

const uploadQueueWorker = require('./uploadQueueWorker');
const pool = require('../../shared/config/database');

const logPrefix = '[upload-worker-service]';
const intervalMs = Number(process.env.WORKER_INTERVAL_MS) || 30000;

console.log(`${logPrefix} environment loaded from ${resolvedEnvPath}`);
console.log(`${logPrefix} NODE_ENV=${process.env.NODE_ENV || 'development'}`);

uploadQueueWorker.start(intervalMs);

const shutdown = (signal) => {
  console.log(`${logPrefix} ${signal} received. Starting graceful shutdown...`);
  uploadQueueWorker.stop();

  // Close shared database connections
  pool
    .end()
    .then(() => {
      console.log(`${logPrefix} database pool closed. Exiting.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`${logPrefix} failed to close database pool`, err);
      process.exit(1);
    });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (error) => {
  console.error(`${logPrefix} unhandled rejection`, error);
});

process.on('uncaughtException', (error) => {
  console.error(`${logPrefix} uncaught exception`, error);
  shutdown('UNCAUGHT_EXCEPTION');
});
