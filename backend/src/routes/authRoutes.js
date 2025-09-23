const express = require('express');
const router = express.Router();
const { initiateGoogleAuth, handleGoogleCallback, verifyToken } = require('../controllers/authController');

router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);
router.get('/verify', verifyToken);

module.exports = router;