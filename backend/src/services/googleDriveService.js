const { google } = require('googleapis');
const { oauth2Client } = require('../config/googleAuth');
const pool = require('../config/database');
const { Readable } = require('stream');

class GoogleDriveService {
  async refreshAccessToken(refreshToken) {
    try {
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  async uploadToDrive(imageBuffer, user, fileName = null) {
    try {
      console.log('🔄 Starting Google Drive upload process...', {
        userId: user.id,
        hasRefreshToken: !!user.google_refresh_token,
        hasFolderId: !!user.google_folder_id,
        folderId: user.google_folder_id,
        bufferSize: imageBuffer.length
      });

      // Refresh access token
      console.log('🔑 Refreshing OAuth access token...');
      const credentials = await this.refreshAccessToken(user.google_refresh_token);
      console.log('✅ OAuth token refreshed successfully:', {
        hasAccessToken: !!credentials.access_token,
        expiryDate: credentials.expiry_date,
        scopes: credentials.scope
      });

      oauth2Client.setCredentials(credentials);

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Generate file name if not provided
      if (!fileName) {
        const now = new Date();
        fileName = `LINE_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.jpg`;
      }

      // Prepare file metadata
      const fileMetadata = {
        name: fileName,
        mimeType: 'image/jpeg'
      };

      // Add folder if specified
      if (user.google_folder_id) {
        fileMetadata.parents = [user.google_folder_id];
        console.log('📁 Upload target folder:', {
          folderId: user.google_folder_id,
          fileName: fileName
        });
      } else {
        console.log('⚠️ No folder specified, uploading to My Drive root');
      }

      // Convert Buffer to Stream (required by Google Drive API)
      const bufferStream = Readable.from(imageBuffer);

      // Upload file
      console.log('⬆️ Calling Google Drive API files.create()...');
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: 'image/jpeg',
          body: bufferStream
        },
        fields: 'id, name, size, webViewLink, parents'
      });

      console.log('✅ Upload successful!', {
        fileId: response.data.id,
        fileName: response.data.name,
        fileSize: response.data.size,
        parents: response.data.parents,
        webViewLink: response.data.webViewLink
      });

      // Log upload to database
      await this.logUpload(user.id, fileName, response.data.id, imageBuffer.length, 'success');

      return {
        fileId: response.data.id,
        fileName: response.data.name,
        fileSize: response.data.size || imageBuffer.length,
        webViewLink: response.data.webViewLink
      };

    } catch (error) {
      console.error('❌ Error uploading to Google Drive:', {
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.response?.data,
        stack: error.stack
      });

      // Log failed upload
      await this.logUpload(user.id, fileName || 'unknown', null, 0, 'failed', error.message);

      throw error;
    }
  }

  async logUpload(userId, fileName, googleFileId, fileSize, status, errorMessage = null) {
    const query = `
      INSERT INTO upload_history (
        user_id, 
        google_file_id, 
        google_file_name, 
        file_size, 
        upload_status, 
        error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const values = [userId, googleFileId, fileName, fileSize, status, errorMessage];
    
    try {
      await pool.query(query, values);
    } catch (error) {
      console.error('Error logging upload:', error);
    }
  }

  async createFolder(folderName, user) {
    try {
      const credentials = await this.refreshAccessToken(user.google_refresh_token);
      oauth2Client.setCredentials(credentials);

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const response = await drive.files.create({
        resource: fileMetadata,
        fields: 'id, name'
      });

      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async listFolders(user) {
    try {
      const credentials = await this.refreshAccessToken(user.google_refresh_token);
      oauth2Client.setCredentials(credentials);

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name, mimeType, parents)',
        orderBy: 'name',
        pageSize: 100,
        spaces: 'drive'
      });

      console.log('Google Drive API Response:', {
        totalFolders: response.data.files.length,
        sampleFolders: response.data.files.slice(0, 5).map(f => ({
          name: f.name,
          id: f.id,
          mimeType: f.mimeType
        }))
      });
      
      // Filter out any non-folder items that might have slipped through
      const folders = response.data.files.filter(file => 
        file.mimeType === 'application/vnd.google-apps.folder'
      );
      
      return folders;
    } catch (error) {
      console.error('Error listing folders:', error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveService();