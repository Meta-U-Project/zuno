const express = require('express');
const router = express.Router();
const { getUserProfile, getIntegrations } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, getUserProfile);
router.get('/integrations', verifyToken, getIntegrations);

module.exports = router;
