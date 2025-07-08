const express = require('express');
const router = express.Router();
const { createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/create', verifyToken, createTask);
router.put('/:taskId', verifyToken, updateTask);
router.delete('/:taskId', verifyToken, deleteTask);

module.exports = router;
