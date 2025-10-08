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
    res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
};

const handleGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const lineUserId = req.session.line_user_id;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    const tokens = await getTokens(code);
    const oauth2Client = setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const googleEmail = userInfo.data.email;
    const googleRefreshToken = tokens.refresh_token;

    // Ensure a single user per google_email. If a user with this email exists, update it.
    let user;
    const existing = await pool.query(
      'SELECT id, line_user_id FROM users WHERE google_email = $1 LIMIT 1',
      [googleEmail]
    );

    if (existing.rows.length > 0) {
      const userId = existing.rows[0].id;
      // Only set line_user_id if provided (preserve existing if null)
      const update = await pool.query(
        `UPDATE users
         SET 
           line_user_id = COALESCE($1, line_user_id),
           google_refresh_token = $2,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, line_user_id, google_email`,
        [lineUserId || null, googleRefreshToken, userId]
      );
      user = update.rows[0];
    } else {
      const insert = await pool.query(
        `INSERT INTO users (line_user_id, google_email, google_refresh_token)
         VALUES ($1, $2, $3)
         RETURNING id, line_user_id, google_email`,
        [lineUserId || null, googleEmail, googleRefreshToken]
      );
      user = insert.rows[0];
    }

    // Ensure the user has at least the 'newbie' package assigned
    try {
      const hasPkg = await pool.query(
        'SELECT 1 FROM user_packages WHERE user_id = $1 LIMIT 1',
        [user.id]
      );
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
      // If packages tables do not exist, skip silently
      console.warn('Package assignment skipped:', e.message);
    }

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

    // Redirect back to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}?token=${jwtToken}`;
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
