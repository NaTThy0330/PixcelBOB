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

const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });
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