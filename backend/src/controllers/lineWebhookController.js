const { lineClient } = require('../config/lineConfig');
const axios = require('axios');
const pool = require('../config/database');
const uploadProcessorService = require('../services/uploadProcessorService');
const batchUploadService = require('../services/batchUploadService');
const googleDriveService = require('../services/googleDriveService');

const handleWebhook = async (req, res) => {
  try {
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));
    const events = req.body.events;
    
    if (!events || events.length === 0) {
      console.log('No events in webhook');
      return res.status(200).send('OK');
    }

    for (const event of events) {
      console.log('Processing event:', event.type, event.message?.type);
      if (event.type === 'message' && event.message.type === 'image') {
        await handleImageMessage(event);
      } else if (event.type === 'message' && event.message.type === 'text') {
        await handleTextMessage(event);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const handleTextMessage = async (event) => {
  const lineUserId = event.source.userId;
  const messageText = event.message.text.trim().toLowerCase();

  try {
    // Check for status/help commands
    if (messageText === 'สถานะ' || messageText === 'status' || messageText === 'เช็คสถานะ') {
      const userQuery = 'SELECT * FROM users WHERE line_user_id = $1';
      const userResult = await pool.query(userQuery, [lineUserId]);

      if (userResult.rows.length === 0) {
        const authUrl = `${process.env.FRONTEND_URL}?line_user_id=${lineUserId}`;
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: `❌ ยังไม่ได้เชื่อมต่อระบบ\n\nกรุณาเชื่อมต่อบัญชี Google Drive:\n${authUrl}`
        });
        return;
      }

      const user = userResult.rows[0];
      let status = '✅ สถานะการเชื่อมต่อ:\n\n';

      if (user.google_refresh_token && user.google_folder_id) {
        status += '✓ เชื่อมต่อ Google Drive แล้ว\n';
        status += '✓ เลือกโฟลเดอร์แล้ว\n';
        status += user.google_email ? `✓ อีเมล: ${user.google_email}\n` : '';
        status += '\n📸 พร้อมรับรูปภาพแล้ว!\nส่งรูปมาได้เลยค่ะ';
      } else if (user.google_refresh_token && !user.google_folder_id) {
        const authUrl = `${process.env.FRONTEND_URL}?line_user_id=${lineUserId}`;
        status = '⚠️ เชื่อมต่อ Google Drive แล้ว\nแต่ยังไม่ได้เลือกโฟลเดอร์\n\n';
        status += `กรุณาเลือกโฟลเดอร์:\n${authUrl}`;
      } else {
        const authUrl = `${process.env.FRONTEND_URL}?line_user_id=${lineUserId}`;
        status = '❌ ยังไม่ได้เชื่อมต่อ Google Drive\n\n';
        status += `กรุณาเชื่อมต่อ:\n${authUrl}`;
      }

      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: status
      });
    }
  } catch (error) {
    console.error('Error handling text message:', error);
  }
};

const handleImageMessage = async (event) => {
  const messageId = event.message.id; // Changed from messageId to id
  const lineUserId = event.source.userId;

  console.log('Handling image message:', { messageId, lineUserId });

  try {
    // Check if user is bound to a Google account
    console.log('🔍 Checking user in database...', { lineUserId });
    const userQuery = 'SELECT * FROM users WHERE line_user_id = $1';
    const userResult = await pool.query(userQuery, [lineUserId]);

    if (userResult.rows.length === 0) {
      // User not found in database
      console.log('❌ User not found in database');
      const authUrl = `${process.env.FRONTEND_URL}?line_user_id=${lineUserId}`;
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `กรุณาเชื่อมต่อบัญชี Google Drive ก่อนการใช้งาน\n\nเข้าไปที่: ${authUrl}`
      });
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found:', {
      userId: user.id,
      email: user.google_email,
      hasRefreshToken: !!user.google_refresh_token,
      hasFolderId: !!user.google_folder_id
    });

    // Check if user has completed Google Drive setup
    if (!user.google_refresh_token) {
      // User exists but hasn't connected Google account
      console.log('❌ User missing Google refresh token');
      const authUrl = `${process.env.FRONTEND_URL}?line_user_id=${lineUserId}`;
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `คุณยังไม่ได้เชื่อมต่อบัญชี Google Drive\n\nกรุณาเข้าไปที่: ${authUrl}`
      });
      return;
    }

    if (!user.google_folder_id) {
      // User has Google account but hasn't selected folder
      console.log('❌ User missing Google folder ID');
      const authUrl = `${process.env.FRONTEND_URL}?line_user_id=${lineUserId}`;
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `คุณยังไม่ได้เลือกโฟลเดอร์สำหรับอัพโหลดรูป\n\nกรุณาเข้าไปที่: ${authUrl}`
      });
      return;
    }

    console.log('✅ User validation passed, proceeding with upload');

    // --- Replace your old upload limit check block with this ---
const countQuery = `
  SELECT COUNT(*) AS upload_count
  FROM upload_history
  WHERE user_id = $1 AND upload_status = 'success'
`;
const countResult = await pool.query(countQuery, [user.id]);
const uploadCount = parseInt(countResult.rows[0].upload_count, 10);

// ดึง upload_limit ของ package ล่าสุดของ user
const packageQuery = `
  SELECT p.upload_limit
  FROM user_packages up
  JOIN packages p ON up.package_id = p.id
  WHERE up.user_id = $1
  ORDER BY up.start_date DESC
  LIMIT 1
`;
const packageResult = await pool.query(packageQuery, [user.id]);

// ใช้ค่า upload_limit จาก package ถ้ามี ไม่งั้น fallback เป็น default (เช่น 10,000)
const uploadLimit = packageResult.rows[0]?.upload_limit ?? 10000;

// ตรวจสอบว่าเกิน limit หรือยัง
if (uploadCount >= uploadLimit) {
  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: `คุณใช้งานถึงขีดจำกัดแล้ว (${uploadLimit.toLocaleString()} รูป)\nกรุณาติดต่อผู้ดูแลระบบ`
  });
  return;
}

// --- ถ้ายังไม่ถึง limit ให้ทำต่อได้ตามปกติ ---
    console.log('✅ Upload limit check passed:', { uploadCount, uploadLimit }); 

    

    // Get image content from LINE
    console.log('📥 Fetching image from LINE API...', { messageId });
    const imageStream = await lineClient.getMessageContent(messageId);
    const chunks = [];

    for await (const chunk of imageStream) {
      chunks.push(chunk);
    }

    const imageBuffer = Buffer.concat(chunks);
    console.log('✅ Image retrieved from LINE:', {
      messageId,
      bufferSize: imageBuffer.length,
      sizeInKB: (imageBuffer.length / 1024).toFixed(2)
    });

    // Process upload immediately
    try {
      const uploadResult = await uploadProcessorService.processUploadImmediately(lineUserId, messageId, imageBuffer);

      // Get actual folder name from Google Drive
      let folderName = null;
      if (user.google_folder_id) {
        folderName = await googleDriveService.getFolderName(user.google_folder_id, user.google_refresh_token);
        console.log('📁 Folder name retrieved:', folderName);
      }

      // Add to batch session and check if this is the first photo
      const isFirstPhoto = batchUploadService.addUploadToBatch(
        lineUserId,
        uploadResult,
        folderName,
        user.google_folder_id
      );

      // Only reply for the first photo in a batch
      if (isFirstPhoto) {
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: '📸 เริ่มรับรูปแล้ว! กำลังอัพโหลดไปยัง Google Drive...\n\n💡 ส่งรูปต่อได้เลย ระบบจะสรุปให้อีกครั้งหลังจากที่คุณส่งรูปเสร็จ (รอประมาณ 5 นาที)'
        });
      } else {
        // For subsequent photos, just log - no message sent
        const batchStatus = batchUploadService.getBatchStatus(lineUserId);
        console.log(`📸 Photo ${batchStatus.photoCount} added to batch (silent upload)`);
      }

      console.log('✅ Upload completed successfully');
    } catch (uploadError) {
      console.error('❌ Upload failed:', {
        error: uploadError.message,
        lineUserId,
        messageId
      });

      // Send specific error message to user
      let errorMessage = '❌ เกิดข้อผิดพลาดในการอัพโหลด\n\n';

      if (uploadError.message.includes('invalid_grant') || uploadError.message.includes('Token')) {
        errorMessage += 'ปัญหา: Google Drive token หมดอายุ\nแก้ไข: กรุณาเชื่อมต่อ Google Drive ใหม่';
      } else if (uploadError.message.includes('File not found') || uploadError.message.includes('folder')) {
        errorMessage += 'ปัญหา: ไม่พบโฟลเดอร์ที่เลือก\nแก้ไข: กรุณาเลือกโฟลเดอร์ใหม่';
      } else if (uploadError.message.includes('Insufficient Permission') || uploadError.message.includes('permission')) {
        errorMessage += 'ปัญหา: ไม่มีสิทธิ์เข้าถึง Google Drive\nแก้ไข: กรุณาให้สิทธิ์ใหม่';
      } else {
        errorMessage += `ปัญหา: ${uploadError.message}\n\nรูปของคุณจะถูกเก็บไว้และลองอัพโหลดใหม่ภายหลัง`;
      }

      await lineClient.pushMessage(lineUserId, {
        type: 'text',
        text: errorMessage
      });

      // Ensure the pending uploads table exists before storing for retry
      await uploadProcessorService.ensurePendingUploadsTable();

      // Store for later retry
      const insertQuery = `
        INSERT INTO pending_uploads (line_user_id, message_id, image_data, created_at)
        VALUES ($1, $2, $3, NOW())
      `;

      await pool.query(insertQuery, [lineUserId, messageId, imageBuffer]);
    }

  } catch (error) {
    console.error('Error handling image message:', error);
    
    if (event.replyToken) {
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาลองใหม่อีกครั้ง'
      });
    }
  }
};

const getContentFromLine = async (messageId, accessToken) => {
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  
  const response = await axios({
    method: 'GET',
    url: url,
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    responseType: 'arraybuffer'
  });

  return response.data;
};

module.exports = {
  handleWebhook
};
