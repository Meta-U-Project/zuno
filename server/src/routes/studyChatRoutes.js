const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, startNewChat, getConversations, getStudyContext } = require('../controllers/studyChatController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/message', verifyToken, sendMessage);

router.get('/history', verifyToken, getChatHistory);

router.post('/new-chat', verifyToken, startNewChat);

router.get('/conversations', verifyToken, getConversations);

router.get('/context', verifyToken, getStudyContext);

module.exports = router;
