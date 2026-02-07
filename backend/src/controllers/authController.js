const { google } = require('googleapis');
const pool = require('../../../shared/config/database');
const { getAuthUrl, getTokens, setCredentials } = require('../../../shared/config/googleAuth');
const jwt = require('jsonwebtoken');

const initiateGoogleAuth = (req, res) => {
  try {
    const lineUserId = req.query.line_user_id || req.session.line_user_id;

    console.log('🔐 Initiating Google auth for LINE user:', lineUserId);

    if (lineUserId) {
      req.session.line_user_id = lineUserId;
    }

    // Pass LINE user ID via state parameter (more reliable than sessions for external browser)
    const authUrl = getAuthUrl(lineUserId);
    console.log('Generated auth URL with LINE user ID in state');
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
    const { code, state } = req.query;

    if (!code) {
      console.error('No authorization code provided');
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Try to get LINE user ID from state parameter (primary method)
    let lineUserId = null;
    if (state) {
      try {
        const stateData = JSON.parse(state);
        lineUserId = stateData.line_user_id;
        console.log('✅ LINE User ID from state parameter:', lineUserId);
      } catch (e) {
        console.error('Failed to parse state parameter:', e);
      }
    }

    // Fallback to session if state doesn't have it
    if (!lineUserId && req.session?.line_user_id) {
      lineUserId = req.session.line_user_id;
      console.log('⚠️ LINE User ID from session (fallback):', lineUserId);
    }

    if (!lineUserId) {
      console.warn('LINE User ID not provided during Google callback. Continuing without LINE binding.');
    }

    const tokens = await getTokens(code);
    const oauth2Client = setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const googleEmail = userInfo.data.email;
    const googleRefreshToken = tokens.refresh_token;

    // Prepare upsert for user by google_email
    let user;
    const query = `
      INSERT INTO users (line_user_id, google_email, google_refresh_token)
      VALUES ($1, $2, $3)
      ON CONFLICT (google_email)
      DO UPDATE SET
        google_refresh_token = EXCLUDED.google_refresh_token,
        line_user_id = COALESCE(users.line_user_id, EXCLUDED.line_user_id),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, line_user_id, google_email, google_folder_id;
    `;
    const values = [lineUserId || null, googleEmail, googleRefreshToken];
    console.log('💾 Saving to database:', {
      lineUserId,
      googleEmail,
      hasRefreshToken: !!googleRefreshToken
    });

    const result = await pool.query(query, values);
    user = result.rows[0];

    // Ensure the user has at least the 'newbie' package assigned (best-effort)
    try {
      const hasPkg = await pool.query('SELECT 1 FROM user_packages WHERE user_id = $1 LIMIT 1', [user.id]);
      if (hasPkg.rows.length === 0) {
        const pkgRes = await pool.query(
          "SELECT id, upload_limit FROM packages WHERE name = 'newbie' AND is_active = true LIMIT 1"
        );
        if (pkgRes.rows.length > 0) {
          await pool.query(
            `INSERT INTO user_packages (user_id, package_id, start_date, is_trial)
             VALUES ($1, $2, CURRENT_DATE, true)`,
            [user.id, pkgRes.rows[0].id]
          );
        }
      }
    } catch (e) {
      console.warn('Package assignment skipped:', e.message);
    }

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
