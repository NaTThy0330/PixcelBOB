const express = require('express');
const router = express.Router();
const {
  getUsageStats,
  getQuotaInfo,
  getRecentActivity
} = require('../controllers/statsController');

// Statistics endpoints
router.get('/usage', getUsageStats);
router.get('/quota', getQuotaInfo);
router.get('/activity', getRecentActivity);

module.exports = router;