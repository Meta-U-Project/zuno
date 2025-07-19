const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    getIntegrations,
    saveStudyPreferences,
    getStudyPreferences,
    updateUserProfile,
    getUserTasks,
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, getUserProfile);
router.post('/profile', verifyToken, updateUserProfile);
router.get('/integrations', verifyToken, getIntegrations);
router.get('/study-preferences', verifyToken, getStudyPreferences);
router.post('/study-preferences', verifyToken, saveStudyPreferences);
router.get('/tasks', verifyToken, getUserTasks);

router.get('/calendar-events', verifyToken, getCalendarEvents);
router.post('/calendar-events', verifyToken, createCalendarEvent);
router.put('/calendar-events/:eventId', verifyToken, updateCalendarEvent);
router.delete('/calendar-events/:eventId', verifyToken, deleteCalendarEvent);

module.exports = router;
