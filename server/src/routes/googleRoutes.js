const express = require('express');
const router = express.Router();
const { auth, callback, checkAndCreateCalendar, syncCalendarEvents } = require('../controllers/googleController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/auth', verifyToken, auth);
router.get('/callback', callback);

router.get('/calendar/setup', verifyToken, checkAndCreateCalendar);
router.post('/calendar/sync', verifyToken, syncCalendarEvents);

module.exports = router;
