const express = require('express');
const router = express.Router();
const {
  bindLineAccount,
  unbindLineAccount,
  getBindingStatus,
  setGoogleDriveFolder,
  getGoogleDriveFolders,
  getUploadHistory
} = require('../controllers/userController');

// User account binding
router.post('/bind', bindLineAccount);
router.post('/unbind', unbindLineAccount);
router.get('/binding-status', getBindingStatus);

// Google Drive folder management
router.post('/folder', setGoogleDriveFolder);
router.get('/folders', getGoogleDriveFolders);

// Upload history
router.get('/uploads', getUploadHistory);

module.exports = router;