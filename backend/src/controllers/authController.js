const { google } = require('googleapis');
const pool = require('../config/database');
const { getAuthUrl, getTokens, setCredentials } = require('../config/googleAuth');
const jwt = require('jsonwebtoken');

const initiateGoogleAuth = (req, res) => {
  try {
    const lineUserId = req.query.line_user_id || req.session.line_user_id;

    console.log('Starting Google auth, LINE user:', lineUserId || 'none');

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
        console.log('LINE user from state parameter:', lineUserId);
      } catch (e) {
        console.error('Failed to parse state parameter:', e);
      }
    }

    // Fallback to session if state doesn't have it
    if (!lineUserId && req.session?.line_user_id) {
      lineUserId = req.session.line_user_id;
      console.log('LINE user from session (fallback):', lineUserId);
    }

    let tokens;
    try {
      tokens = await getTokens(code);
    } catch (tokenError) {
      console.error('Token exchange failed:', tokenError?.message || tokenError);
      const redirectUrl = `${process.env.FRONTEND_URL}?error=token_exchange_failed&message=${encodeURIComponent(
        tokenError?.message || 'Unable to exchange code'
      )}`;
      return res.redirect(redirectUrl);
    }

    const oauth2Client = setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    let userInfo;
    try {
      userInfo = await oauth2.userinfo.get();
    } catch (profileError) {
      console.error('Failed to fetch Google profile:', profileError?.message || profileError);
      const redirectUrl = `${process.env.FRONTEND_URL}?error=profile_fetch_failed&message=${encodeURIComponent(
        profileError?.message || 'Unable to fetch Google profile'
      )}`;
      return res.redirect(redirectUrl);
    }

    const googleEmail = userInfo.data.email;
    const googleRefreshToken = tokens.refresh_token;

    if (!googleEmail) {
      console.error('Google account email missing from profile response');
      const redirectUrl = `${process.env.FRONTEND_URL}?error=missing_email`;
      return res.redirect(redirectUrl);
    }

    // Find or create user by LINE ID (if present) or Google email (fallback)
    const client = await pool.connect();
    let user;

    try {
      await client.query('BEGIN');

      const existingByLine = lineUserId
        ? await client.query('SELECT id FROM users WHERE line_user_id = $1', [lineUserId])
        : { rows: [] };

      const existingByEmail = await client.query('SELECT id FROM users WHERE google_email = $1', [googleEmail]);

      const targetUser = existingByLine.rows[0] || existingByEmail.rows[0];

      if (targetUser) {
        const updateQuery = `
          UPDATE users
          SET 
            line_user_id = COALESCE($1, line_user_id),
            google_email = $2,
            google_refresh_token = COALESCE($3, google_refresh_token),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING id, line_user_id, google_email, google_folder_id;
        `;

        const updateValues = [lineUserId, googleEmail, googleRefreshToken, targetUser.id];
        const updateResult = await client.query(updateQuery, updateValues);
        user = updateResult.rows[0];
      } else {
        const insertQuery = `
          INSERT INTO users (line_user_id, google_email, google_refresh_token)
          VALUES ($1, $2, $3)
          RETURNING id, line_user_id, google_email, google_folder_id;
        `;

        const insertResult = await client.query(insertQuery, [lineUserId, googleEmail, googleRefreshToken]);
        user = insertResult.rows[0];
      }

      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database error while saving user:', dbError?.message || dbError);
      const redirectUrl = `${process.env.FRONTEND_URL}?error=db_error&message=${encodeURIComponent(
        dbError?.message || 'Database error'
      )}`;
      return res.redirect(redirectUrl);
    } finally {
      client.release();
    }

    console.log('User saved to database:', {
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

    if (req.session) {
      req.session.destroy();
    }

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
    console.error('Error handling Google callback:', error?.message || error, error?.stack);
    // Redirect to frontend with error
    const redirectUrl = `${process.env.FRONTEND_URL}?error=auth_failed&message=${encodeURIComponent(
      error?.message || 'Unexpected error'
    )}`;
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
        name: user.google_email ? user.google_email.split('@')[0] : 'User',
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
