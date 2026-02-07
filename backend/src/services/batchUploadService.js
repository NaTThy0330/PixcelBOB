const { lineClient } = require('../../../shared/config/lineConfig');

class BatchUploadService {
  constructor() {
    // Store batch sessions for each user
    // Structure: { lineUserId: { timer, uploads: [], startTime } }
    this.batchSessions = new Map();
    this.BATCH_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  // Start or continue a batch session for a user
  startOrContinueBatch(lineUserId, uploadResult) {
    let session = this.batchSessions.get(lineUserId);

    if (!session) {
      // First photo - create new session
      console.log('📸 Starting new batch session for user:', lineUserId);
      session = {
        uploads: [],
        startTime: new Date(),
        timer: null,
        folderName: null,
        folderId: null
      };
      this.batchSessions.set(lineUserId, session);

      // Return true to indicate this is the first photo
      return { isFirstPhoto: true, session };
    } else {
      // Subsequent photo - clear existing timer
      console.log('📸 Continuing batch session, resetting timer');
      if (session.timer) {
        clearTimeout(session.timer);
      }
      return { isFirstPhoto: false, session };
    }
  }

  // Add upload to batch and set/reset timer
  addUploadToBatch(lineUserId, uploadResult, folderName = null, folderId = null) {
    const { isFirstPhoto, session } = this.startOrContinueBatch(lineUserId, uploadResult);

    // Add upload to session
    session.uploads.push({
      fileName: uploadResult.fileName,
      fileId: uploadResult.fileId,
      webViewLink: uploadResult.webViewLink,
      timestamp: new Date()
    });

    // Store folder info
    if (folderName) session.folderName = folderName;
    if (folderId) session.folderId = folderId;

    // Set new timer to send summary after 5 minutes of inactivity
    session.timer = setTimeout(() => {
      this.sendBatchSummary(lineUserId);
    }, this.BATCH_TIMEOUT);

    console.log(`📊 Batch session updated: ${session.uploads.length} photos, timer reset to 5 minutes`);

    return isFirstPhoto;
  }

  // Send summary message to user
  async sendBatchSummary(lineUserId) {
    const session = this.batchSessions.get(lineUserId);

    if (!session || session.uploads.length === 0) {
      console.log('No uploads to summarize for user:', lineUserId);
      return;
    }

    console.log('📨 Sending batch summary to user:', lineUserId);

    const totalPhotos = session.uploads.length;
    const folderLink = session.folderId
      ? `https://drive.google.com/drive/folders/${session.folderId}`
      : 'https://drive.google.com/drive/my-drive';

    const duration = Math.floor((new Date() - session.startTime) / 1000 / 60); // minutes

    let message = `✅ อัพโหลดเสร็จสิ้น!\n\n`;
    message += `📊 สรุป: อัพโหลดสำเร็จ ${totalPhotos} รูป\n`;
    message += `⏱️ ใช้เวลา: ${duration} นาที\n`;

    if (session.folderName) {
      message += `📁 โฟลเดอร์: ${session.folderName}\n`;
    }

    message += `\n🔗 ดูรูปทั้งหมด:\n${folderLink}\n\n`;

    // Show first 3 and last 3 files if more than 6 files
    if (totalPhotos <= 6) {
      message += `📸 ไฟล์ที่อัพโหลด:\n`;
      session.uploads.forEach((upload, index) => {
        message += `${index + 1}. ${upload.fileName}\n`;
      });
    } else {
      message += `📸 ตัวอย่างไฟล์:\n`;
      // First 3
      session.uploads.slice(0, 3).forEach((upload, index) => {
        message += `${index + 1}. ${upload.fileName}\n`;
      });
      message += `... และอีก ${totalPhotos - 6} ไฟล์\n`;
      // Last 3
      const lastIndex = totalPhotos - 3;
      session.uploads.slice(-3).forEach((upload, index) => {
        message += `${lastIndex + index + 1}. ${upload.fileName}\n`;
      });
    }

    try {
      await lineClient.pushMessage(lineUserId, {
        type: 'text',
        text: message
      });

      console.log('✅ Batch summary sent successfully');
    } catch (error) {
      console.error('Error sending batch summary:', error);
    }

    // Clean up session
    this.batchSessions.delete(lineUserId);
  }

  // Get current batch status for a user
  getBatchStatus(lineUserId) {
    const session = this.batchSessions.get(lineUserId);
    if (!session) return null;

    return {
      photoCount: session.uploads.length,
      startTime: session.startTime,
      timeElapsed: Math.floor((new Date() - session.startTime) / 1000)
    };
  }

  // Cancel batch for a user (if needed)
  cancelBatch(lineUserId) {
    const session = this.batchSessions.get(lineUserId);
    if (session && session.timer) {
      clearTimeout(session.timer);
    }
    this.batchSessions.delete(lineUserId);
  }
}

module.exports = new BatchUploadService();
