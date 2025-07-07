const express = require('express');
const router = express.Router();
const { saveCanvasCredentials, fetchAssignments, fetchCourses, fetchCalendarEventsFromAssignments } = require('../controllers/canvasController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/connect', verifyToken, saveCanvasCredentials)
router.get('/assignments', verifyToken, fetchAssignments)
router.get('/courses', verifyToken, fetchCourses)
router.get('/calendarevents', verifyToken, fetchCalendarEventsFromAssignments);


module.exports = router;
