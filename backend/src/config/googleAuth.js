const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive'
];

const getAuthUrl = (lineUserId = null) => {
  const authParams = {
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  };

  // Pass LINE user ID via state parameter to preserve it across OAuth flow
  if (lineUserId) {
    authParams.state = JSON.stringify({ line_user_id: lineUserId });
  }

  return oauth2Client.generateAuthUrl(authParams);
};

const getTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken({
    code: code,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });
  return tokens;
};

const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
};

module.exports = {
  oauth2Client,
  getAuthUrl,
  getTokens,
  setCredentials,
  SCOPES
};