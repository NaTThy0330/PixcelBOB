const uploadProcessorService = require('../services/uploadProcessorService');

class UploadQueueWorker {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  start(intervalMs = 30000) { // Default: process every 30 seconds
    if (this.isRunning) {
      console.log('Upload queue worker is already running');
      return;
    }

    console.log('Starting upload queue worker...');
    this.isRunning = true;

    // Process immediately on start
    this.processQueue();

    // Set up interval for periodic processing
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  stop() {
    if (!this.isRunning) {
      console.log('Upload queue worker is not running');
      return;
    }

    console.log('Stopping upload queue worker...');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  async processQueue() {
    try {
      console.log('Processing upload queue...');
      const result = await uploadProcessorService.processPendingUploads();
      
      if (result.processed > 0) {
        console.log(`Processed ${result.processed} uploads successfully`);
      }
    } catch (error) {
      console.error('Error processing upload queue:', error);
    }
  }
}

module.exports = new UploadQueueWorker();