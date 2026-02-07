const { Client } = require('@line/bot-sdk');
require('dotenv').config();

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const lineClient = new Client(lineConfig);

module.exports = {
  lineConfig,
  lineClient
};