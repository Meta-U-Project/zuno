const express = require('express');
const router = express.Router();
const { getUserProfile, getIntegrations, saveStudyPreferences, getStudyPreferences } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, getUserProfile);
router.get('/integrations', verifyToken, getIntegrations);
router.get('/study-preferences', verifyToken, getStudyPreferences);
router.post('/study-preferences', verifyToken, saveStudyPreferences);

module.exports = router;
