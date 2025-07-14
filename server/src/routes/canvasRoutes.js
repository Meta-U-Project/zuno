const express = require('express');
const router = express.Router();
const { saveCanvasCredentials, fetchCanvasTasks, fetchCourses, fetchCalendarEventsFromTasks, fetchAnnouncements } = require('../controllers/canvasController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/connect', verifyToken, saveCanvasCredentials)
router.get('/assignments', verifyToken, fetchCanvasTasks)
router.get('/courses', verifyToken, fetchCourses)
router.get('/calendarevents', verifyToken, fetchCalendarEventsFromTasks);
router.get('/announcements', verifyToken, fetchAnnouncements);


module.exports = router;
