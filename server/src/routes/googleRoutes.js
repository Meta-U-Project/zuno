const express = require('express');
const router = express.Router();
const { auth, callback } = require('../controllers/googleController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/auth', verifyToken, auth);
router.get('/callback', callback);

module.exports = router;
