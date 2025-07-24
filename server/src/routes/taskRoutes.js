const express = require('express');
const router = express.Router();
const { createTask, updateTask, deleteTask, markCalendarEventAttended, scheduleStudySessions, checkTasksNeedingScheduling } = require('../controllers/taskController');
const { verifyToken } = require('../middleware/authMiddleware');
const {
    syncToGoogleCalendar,
    syncEntityAfterSave,
    prepareTaskSync,
    handleEntityDeletion
} = require('../middleware/googleSyncMiddleware');

router.post('/create', verifyToken, syncToGoogleCalendar, prepareTaskSync, createTask, syncEntityAfterSave);
router.put('/:taskId', verifyToken, syncToGoogleCalendar, prepareTaskSync, updateTask, syncEntityAfterSave);
router.delete('/:taskId', verifyToken, prepareTaskSync, handleEntityDeletion, deleteTask);
router.post('/schedule', verifyToken, scheduleStudySessions);
router.get('/need-scheduling', verifyToken, checkTasksNeedingScheduling);
router.put('/calendar-event/:eventId/attendance', verifyToken, markCalendarEventAttended);

module.exports = router;
