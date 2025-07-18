const express = require('express');
const router = express.Router();
const { saveCanvasCredentials, fetchCanvasTasks, fetchCourses, fetchCalendarEventsFromTasks, fetchAnnouncements, fetchClassSessions } = require('../controllers/canvasController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/connect', verifyToken, saveCanvasCredentials)
router.get('/assignments', verifyToken, fetchCanvasTasks)
router.get('/courses', verifyToken, fetchCourses)
router.get('/calendarevents', verifyToken, fetchCalendarEventsFromTasks);
router.get('/announcements', verifyToken, fetchAnnouncements);
router.get('/classsessions', verifyToken, fetchClassSessions);


module.exports = router;
