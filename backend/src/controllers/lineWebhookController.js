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
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      // User not bound, send binding instructions with LINE user ID
      const authUrl = `${process.env.FRONTEND_URL}?line_user_id=${lineUserId}`;
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `กรุณาเชื่อมต่อบัญชี Google Drive ก่อนการใช้งาน\n\nเข้าไปที่: ${authUrl}`
      });
      return;
    }

    const user = userResult.rows[0];

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