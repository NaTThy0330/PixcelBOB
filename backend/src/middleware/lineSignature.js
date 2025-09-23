const crypto = require('crypto');

const validateLineSignature = (channelSecret) => {
  return (req, res, next) => {
    const signature = req.get('x-line-signature');
    
    if (!signature) {
      console.error('WEBHOOK001: No signature provided');
      return res.status(403).json({ error: 'No signature provided' });
    }

    // The raw body should be available as req.body (Buffer) from express.raw()
    
    // Handle LINE verify request (empty body)
    if (!body || (Buffer.isBuffer(body) && body.length === 0)) {
      return res.status(200).json({ status: 'OK' });
    }
    
    if (!Buffer.isBuffer(body)) {
      console.error('WEBHOOK002: Request body is not a buffer. Make sure express.raw() middleware is used.');
      return res.status(400).json({ error: 'Invalid request body format' });
    }

    const hash = crypto
      .createHmac('SHA256', channelSecret)
      .update(body)
      .digest('base64');

    if (signature !== hash) {
      console.error('WEBHOOK001: Invalid signature attempt');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Parse the body and attach it to req for the next middleware
    try {
      req.body = JSON.parse(body.toString('utf8'));
    } catch (error) {
      console.error('WEBHOOK002: Malformed request body', error);
      return res.status(400).json({ error: 'Malformed request body' });
    }

    next();
  };
};

module.exports = validateLineSignature;