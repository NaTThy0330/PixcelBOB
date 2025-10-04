const { google } = require('googleapis');
const pool = require('../config/database');
const { getAuthUrl, getTokens, setCredentials } = require('../config/googleAuth');
const jwt = require('jsonwebtoken');

const initiateGoogleAuth = (req, res) => {
  try {
    const lineUserId = req.query.line_user_id || req.session.line_user_id;

    if (lineUserId) {
      req.session.line_user_id = lineUserId;
    }

    const authUrl = getAuthUrl();
    console.log('Generated auth URL:', authUrl);
    console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
};

const handleGoogleCallback = async (req, res) => {
  try {
    console.log('Callback received - Query params:', req.query);
    console.log('Callback URL:', req.url);
    console.log('Session data:', req.session);
    const { code } = req.query;
    const lineUserId = req.session.line_user_id;

    console.log('LINE User ID from session:', lineUserId);

    if (!code) {
      console.error('No authorization code provided');
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    if (!lineUserId) {
      console.error('⚠️ LINE User ID not found in session!');
      console.error('This means the session was lost between /auth/google and callback');
      // Try to redirect back with error
      const redirectUrl = `${process.env.FRONTEND_URL}?error=session_lost&message=Please try connecting again`;
      return res.redirect(redirectUrl);
    }

    const tokens = await getTokens(code);
    const oauth2Client = setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const googleEmail = userInfo.data.email;
    const googleRefreshToken = tokens.refresh_token;

    const query = `
      INSERT INTO users (line_user_id, google_email, google_refresh_token)
      VALUES ($1, $2, $3)
      ON CONFLICT (line_user_id) 
      DO UPDATE SET 
        google_email = $2,
        google_refresh_token = $3,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, line_user_id, google_email;
    `;

    const values = [lineUserId, googleEmail, googleRefreshToken];
    console.log('💾 Saving to database:', {
      lineUserId,
      googleEmail,
      hasRefreshToken: !!googleRefreshToken
    });

    const result = await pool.query(query, values);
    const user = result.rows[0];

    console.log('✅ User saved to database:', {
      id: user.id,
      line_user_id: user.line_user_id,
      google_email: user.google_email
    });

    const jwtToken = jwt.sign(
      {
        id: user.id,
        line_user_id: user.line_user_id,
        google_email: user.google_email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.session.destroy();

    // Redirect back to LIFF if available, otherwise to frontend
    let redirectUrl;
    if (process.env.LIFF_URL) {
      // Redirect to LIFF URL - will open in LINE app
      redirectUrl = `${process.env.LIFF_URL}?token=${jwtToken}`;
    } else {
      // Fallback to regular frontend URL
      redirectUrl = `${process.env.FRONTEND_URL}?token=${jwtToken}`;
    }

    console.log('Redirecting to:', redirectUrl);
    console.log('FRONTEND_URL env var:', process.env.FRONTEND_URL);
    console.log('LIFF_URL env var:', process.env.LIFF_URL);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Error handling Google callback:', error);
    // Redirect to frontend with error
    const redirectUrl = `${process.env.FRONTEND_URL}?error=auth_failed`;
    res.redirect(redirectUrl);
  }
};

const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user details from database
    const query = `
      SELECT id, line_user_id, google_email, google_folder_id, created_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ valid: false, error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    res.json({ 
      valid: true, 
      user: {
        email: user.google_email,
        name: user.google_email.split('@')[0], // Extract name from email
        line_user_id: user.line_user_id,
        google_drive_folder_id: user.google_folder_id
      }
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
};

module.exports = {
  initiateGoogleAuth,
  handleGoogleCallback,
  verifyToken
};