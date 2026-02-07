const uploadProcessorService = require('../../shared/services/uploadProcessorService');

const logPrefix = '[upload-worker]';

class UploadQueueWorker {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  start(intervalMs = 30000) {
    if (this.isRunning) {
      console.log(`${logPrefix} queue worker is already running`);
      return;
    }

    console.log(`${logPrefix} starting with interval ${intervalMs}ms`);
    this.isRunning = true;

    const run = async () => {
      if (!this.isRunning) {
        return;
      }

      await this.processQueue();
    };

    run().catch((err) => {
      console.error(`${logPrefix} worker crashed on first run`, err);
    });

    this.intervalId = setInterval(() => {
      run().catch((err) => {
        console.error(`${logPrefix} worker iteration failed`, err);
      });
    }, intervalMs);
  }

  stop() {
    if (!this.isRunning) {
      console.log(`${logPrefix} queue worker is not running`);
      return;
    }

    console.log(`${logPrefix} stopping queue worker`);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  async processQueue() {
    try {
      console.log(`${logPrefix} checking pending uploads...`);
      const result = await uploadProcessorService.processPendingUploads();

      if (result.processed > 0) {
        console.log(`${logPrefix} processed ${result.processed} uploads`);
      } else {
        console.log(`${logPrefix} no pending uploads`);
      }
    } catch (error) {
      console.error(`${logPrefix} error processing upload queue`, error);
    }
  }
}

module.exports = new UploadQueueWorker();
