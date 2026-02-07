const pool = require('../../../shared/config/database');
const jwt = require('jsonwebtoken');
const googleDriveService = require('../../../shared/services/googleDriveService');
const { google } = require('googleapis');
const { oauth2Client } = require('../../../shared/config/googleAuth');
const { lineClient } = require('../../../shared/config/lineConfig');

const bindLineAccount = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let { lineUserId } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!lineUserId) {
      return res.status(400).json({ error: 'LINE user ID is required' });
    }

    lineUserId = lineUserId.trim().toUpperCase();

    // Basic format guard: LINE Messaging API userIds start with "U" followed by 32 hex chars
    if (!/^U[a-fA-F0-9]{32}$/.test(lineUserId)) {
      return res.status(400).json({
        error: 'Invalid LINE user ID format. Please open PixcelBOB via LINE (LIFF) so we can capture your ID automatically.'
      });
    }

    // Ensure this LINE user has added the bot and is reachable
    try {
      await lineClient.getProfile(lineUserId);
    } catch (profileError) {
      const errMsg =
        profileError.response?.data?.message ||
        profileError.originalError?.response?.data?.message ||
        profileError.message;
      return res.status(400).json({
        error:
          'ไม่พบ LINE ID นี้ในบอท PixcelBOB กรุณาเพิ่มเพื่อน (Add Friend) กับบอทและเปิดแอปผ่าน LINE อีกครั้ง.',
        details: errMsg
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Update user record with LINE user ID
    const updateQuery = `
      UPDATE users 
      SET line_user_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, line_user_id, google_email
    `;

    const result = await pool.query(updateQuery, [lineUserId, decoded.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = result.rows[0];

    // Send confirmation message to LINE user
    try {
      await lineClient.pushMessage(lineUserId, {
        type: 'text',
        text: '✅ PixcelBOB: LINE account connected สำเร็จ!\n\nตอนนี้คุณสามารถส่งรูปเข้ามาที่บอทได้เลย ระบบจะอัปโหลดไปยัง Google Drive ให้โดยอัตโนมัติ'
      });
    } catch (lineError) {
      const status = lineError.status || lineError.code;
      const responseBody = lineError.originalError?.response?.data || lineError.response?.data;
      console.warn('Failed to send LINE confirmation message:', status, lineError.message, responseBody || '');
    }

    res.json({
      message: 'LINE account successfully bound',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error binding LINE account:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to bind LINE account' });
  }
};

const unbindLineAccount = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Remove LINE user ID from user record
    const updateQuery = `
      UPDATE users 
      SET line_user_id = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, google_email
    `;

    const result = await pool.query(updateQuery, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'LINE account successfully unbound',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error unbinding LINE account:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to unbind LINE account' });
  }
};

const getBindingStatus = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user binding status
    const query = `
      SELECT 
        id, 
        line_user_id, 
        google_email, 
        google_folder_id,
        CASE 
          WHEN line_user_id IS NOT NULL THEN true 
          ELSE false 
        END as line_connected,
        CASE 
          WHEN google_refresh_token IS NOT NULL THEN true 
          ELSE false 
        END as google_connected
      FROM users 
      WHERE id = $1
    `;

    const result = await pool.query(query, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      binding: {
        lineConnected: user.line_connected,
        googleConnected: user.google_connected,
        lineUserId: user.line_user_id,
        googleEmail: user.google_email,
        googleFolderId: user.google_folder_id
      }
    });

  } catch (error) {
    console.error('Error getting binding status:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to get binding status' });
  }
};

const setGoogleDriveFolder = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { folderId } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Update folder ID
    const updateQuery = `
      UPDATE users 
      SET google_folder_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, google_folder_id
    `;

    const result = await pool.query(updateQuery, [folderId, decoded.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Google Drive folder updated successfully',
      folderId: result.rows[0].google_folder_id
    });

  } catch (error) {
    console.error('Error setting Google Drive folder:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to set Google Drive folder' });
  }
};

const debugGoogleDriveFiles = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [decoded.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    
    // Get ALL files to debug
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const credentials = await googleDriveService.refreshAccessToken(user.google_refresh_token);
    oauth2Client.setCredentials(credentials);
    
    const response = await drive.files.list({
      fields: 'files(id, name, mimeType)',
      pageSize: 20,
      orderBy: 'name'
    });

    res.json({
      totalFiles: response.data.files.length,
      files: response.data.files
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Failed to debug' });
  }
};

const getGoogleDriveFolders = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user data
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [decoded.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.google_refresh_token) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    // Get folders from Google Drive
    const folders = await googleDriveService.listFolders(user);

    res.json({ folders });

  } catch (error) {
    console.error('Error getting Google Drive folders:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to get Google Drive folders' });
  }
};

const getUploadHistory = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { limit = 20, offset = 0 } = req.query;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get upload history
    const query = `
      SELECT 
        id,
        line_message_id,
        google_file_id,
        google_file_name,
        file_size,
        upload_status,
        error_message,
        created_at
      FROM upload_history 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [decoded.id, limit, offset]);

    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM upload_history WHERE user_id = $1';
    const countResult = await pool.query(countQuery, [decoded.id]);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      uploads: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < totalCount
      }
    });

  } catch (error) {
    console.error('Error getting upload history:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Failed to get upload history' });
  }
};

module.exports = {
  bindLineAccount,
  unbindLineAccount,
  getBindingStatus,
  setGoogleDriveFolder,
  getGoogleDriveFolders,
  getUploadHistory
};
