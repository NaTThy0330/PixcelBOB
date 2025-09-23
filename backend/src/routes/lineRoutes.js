const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/lineWebhookController');
const crypto = require('crypto');

// LINE webhook verification (GET request)
router.get('/webhook', (req, res) => {
  console.log('LINE webhook verification request received');
  res.status(200).send('OK');
});

// LINE webhook with signature validation
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.get('x-line-signature');
    const body = req.body;
    
    // Validate signature
    if (signature && Buffer.isBuffer(body)) {
      const channelSecret = process.env.LINE_CHANNEL_SECRET;
      const hash = crypto
        .createHmac('SHA256', channelSecret)
        .update(body)
        .digest('base64');
      
      if (signature !== hash) {
        console.error('Invalid signature');
        return res.status(403).json({ error: 'Invalid signature' });
      }
    }
    
    // Parse body - check if it's already parsed
    let jsonBody;
    if (typeof body === 'object' && !Buffer.isBuffer(body)) {
      jsonBody = body;
    } else {
      jsonBody = JSON.parse(body.toString('utf8'));
    }
    
    // LINE verification
    if (jsonBody.events && jsonBody.events.length === 0) {
      return res.status(200).send('OK');
    }
    
    // Handle webhook
    req.body = jsonBody;
    await handleWebhook(req, res);
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;