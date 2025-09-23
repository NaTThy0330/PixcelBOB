const pool = require('../config/database');
const googleDriveService = require('./googleDriveService');
const { lineClient } = require('../config/lineConfig');

class UploadProcessorService {
  async processPendingUploads() {
    try {
      // Get unprocessed uploads
      const query = `
        SELECT pu.*, u.* 
        FROM pending_uploads pu
        JOIN users u ON pu.line_user_id = u.line_user_id
        WHERE pu.processed = false
        ORDER BY pu.created_at ASC
        LIMIT 10
      `;

      const result = await pool.query(query);
      const pendingUploads = result.rows;

      for (const upload of pendingUploads) {
        await this.processUpload(upload);
      }

      return {
        processed: pendingUploads.length,
        status: 'success'
      };

    } catch (error) {
      console.error('Error processing pending uploads:', error);
      throw error;
    }
  }

  async processUpload(upload) {
    try {
      // Upload to Google Drive
      const uploadResult = await googleDriveService.uploadToDrive(
        upload.image_data,
        {
          id: upload.id,
          google_refresh_token: upload.google_refresh_token,
          google_folder_id: upload.google_folder_id
        }
      );

      // Mark as processed
      await pool.query(
        'UPDATE pending_uploads SET processed = true WHERE id = $1',
        [upload.id]
      );

      // Update upload history with LINE message ID
      await pool.query(
        'UPDATE upload_history SET line_message_id = $1 WHERE google_file_id = $2',
        [upload.message_id, uploadResult.fileId]
      );

      // Send notification to user via LINE
      if (upload.line_user_id) {
        await this.notifyUser(upload.line_user_id, uploadResult);
      }

      return uploadResult;

    } catch (error) {
      console.error('Error processing upload:', error);
      
      // Mark as failed but keep in queue for retry
      await pool.query(
        'UPDATE pending_uploads SET processed = true WHERE id = $1',
        [upload.id]
      );

      throw error;
    }
  }

  async notifyUser(lineUserId, uploadResult) {
    try {
      const message = {
        type: 'text',
        text: `✅ อัพโหลดรูปภาพสำเร็จ!\nชื่อไฟล์: ${uploadResult.fileName}\nดูไฟล์: ${uploadResult.webViewLink}`
      };

      await lineClient.pushMessage(lineUserId, message);
    } catch (error) {
      console.error('Error notifying user:', error);
      // Don't throw error for notification failures
    }
  }

  async processUploadImmediately(lineUserId, messageId, imageBuffer) {
    try {
      // Get user data
      const userQuery = 'SELECT * FROM users WHERE line_user_id = $1';
      const userResult = await pool.query(userQuery, [lineUserId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Upload to Google Drive
      const uploadResult = await googleDriveService.uploadToDrive(
        imageBuffer,
        user
      );

      // Log to upload history
      await pool.query(
        'UPDATE upload_history SET line_message_id = $1 WHERE google_file_id = $2',
        [messageId, uploadResult.fileId]
      );

      // Notify user
      await this.notifyUser(lineUserId, uploadResult);

      return uploadResult;

    } catch (error) {
      console.error('Error in immediate upload:', error);
      throw error;
    }
  }
}

module.exports = new UploadProcessorService();