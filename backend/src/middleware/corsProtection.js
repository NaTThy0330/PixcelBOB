// Middleware for route-specific CORS protection
const corsProtection = {
  // Strict CORS for authentication routes
  authOnly: (req, res, next) => {
    const origin = req.headers.origin;
    const allowedAuthOrigins = [
      process.env.FRONTEND_URL,
      'https://pixcelbob.vercel.app'
    ];
    
    if (!origin || !allowedAuthOrigins.includes(origin)) {
      return res.status(403).json({ error: 'Forbidden: Invalid origin for auth route' });
    }
    next();
  },
  
  // No CORS check for LINE webhook (LINE doesn't send Origin header)
  webhookOnly: (req, res, next) => {
    // LINE webhook verification
    if (!req.get('x-line-signature')) {
      return res.status(401).json({ error: 'Missing LINE signature' });
    }
    next();
  },
  
  // Public routes (health check, etc)
  public: (req, res, next) => {
    next();
  }
};

module.exports = corsProtection;