const express = require('express');
const { getNotes, getNoteById, createNote, updateNote, deleteNote, getUserTags } = require('../controllers/noteController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);
router.get('/tags/all', getUserTags);
router.get('/:id', getNoteById);
router.get('/', getNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
