const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.get('/', verifyToken, notificationController.getUserNotifications);
router.get('/unread', verifyToken, notificationController.getUnreadNotifications);
router.put('/:id/read', verifyToken, notificationController.markNotificationAsRead);
router.put('/read-all', verifyToken, notificationController.markAllNotificationsAsRead);

module.exports = router;
