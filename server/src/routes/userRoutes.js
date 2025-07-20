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
    deleteCalendarEvent,
    syncAllCalendarEvents
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const {
    syncToGoogleCalendar,
    syncEntityAfterSave,
    prepareCalendarEventSync,
    handleEntityDeletion
} = require('../middleware/googleSyncMiddleware');

router.get('/profile', verifyToken, getUserProfile);
router.post('/profile', verifyToken, updateUserProfile);
router.get('/integrations', verifyToken, getIntegrations);
router.get('/study-preferences', verifyToken, getStudyPreferences);
router.post('/study-preferences', verifyToken, saveStudyPreferences);
router.get('/tasks', verifyToken, getUserTasks);

router.get('/calendar-events', verifyToken, getCalendarEvents);
router.post('/calendar-events', verifyToken, syncToGoogleCalendar, prepareCalendarEventSync, createCalendarEvent, syncEntityAfterSave);
router.put('/calendar-events/:eventId', verifyToken, syncToGoogleCalendar, prepareCalendarEventSync, updateCalendarEvent, syncEntityAfterSave);
router.delete('/calendar-events/:eventId', verifyToken, prepareCalendarEventSync, handleEntityDeletion, deleteCalendarEvent);
router.post('/calendar-events/sync', verifyToken, syncAllCalendarEvents);

module.exports = router;
