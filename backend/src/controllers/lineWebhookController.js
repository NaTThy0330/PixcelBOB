const { lineClient } = require('../config/lineConfig');
const axios = require('axios');
const pool = require('../config/database');
const uploadProcessorService = require('../services/uploadProcessorService');

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
    const userQuery = 'SELECT * FROM users WHERE line_user_id = $1';
    const userResult = await pool.query(userQuery, [lineUserId]);

    if (userResult.rows.length === 0) {
      // User not found in database
      const authUrl = `${process.env.FRONTEND_URL}?line_user_id=${lineUserId}`;
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `กรุณาเชื่อมต่อบัญชี Google Drive ก่อนการใช้งาน\n\nเข้าไปที่: ${authUrl}`
      });
      return;
    }

    const user = userResult.rows[0];

    // Check if user has completed Google Drive setup
    if (!user.google_refresh_token) {
      // User exists but hasn't connected Google account
      const authUrl = `${process.env.FRONTEND_URL}?line_user_id=${lineUserId}`;
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `คุณยังไม่ได้เชื่อมต่อบัญชี Google Drive\n\nกรุณาเข้าไปที่: ${authUrl}`
      });
      return;
    }

    if (!user.google_folder_id) {
      // User has Google account but hasn't selected folder
      const authUrl = `${process.env.FRONTEND_URL}?line_user_id=${lineUserId}`;
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `คุณยังไม่ได้เลือกโฟลเดอร์สำหรับอัพโหลดรูป\n\nกรุณาเข้าไปที่: ${authUrl}`
      });
      return;
    }

    // Check upload limit (10,000 photos)
    const countQuery = `
      SELECT COUNT(*) as upload_count 
      FROM upload_history 
      WHERE user_id = $1 AND upload_status = 'success'
    `;
    const countResult = await pool.query(countQuery, [user.id]);
    const uploadCount = parseInt(countResult.rows[0].upload_count);
    
    if (uploadCount >= 10000) {
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: 'คุณใช้งานถึงขีดจำกัดแล้ว (10,000 รูป)\nกรุณาติดต่อผู้ดูแลระบบ'
      });
      return;
    }

    // Get image content from LINE
    const imageStream = await lineClient.getMessageContent(messageId);
    const chunks = [];
    
    for await (const chunk of imageStream) {
      chunks.push(chunk);
    }
    
    const imageBuffer = Buffer.concat(chunks);

    // Reply to user immediately
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ได้รับรูปภาพแล้ว กำลังอัพโหลดไปยัง Google Drive...'
    });

    // Process upload immediately (in production, you might want to use a queue)
    try {
      await uploadProcessorService.processUploadImmediately(lineUserId, messageId, imageBuffer);
    } catch (uploadError) {
      console.error('Upload failed:', uploadError);
      
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