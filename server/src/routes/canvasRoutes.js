const express = require('express');
const router = express.Router();
const { saveCanvasCredentials } = require('../controllers/canvasController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/connect', verifyToken, saveCanvasCredentials)

module.exports = router;
