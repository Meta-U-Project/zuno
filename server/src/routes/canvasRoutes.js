const express = require('express');
const router = express.Router();
const { saveCanvasCredentials, fetchAssignments, fetchCourses } = require('../controllers/canvasController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/connect', verifyToken, saveCanvasCredentials)
router.get('/assignments', verifyToken, fetchAssignments)
router.get('/courses', verifyToken, fetchCourses)

module.exports = router;
