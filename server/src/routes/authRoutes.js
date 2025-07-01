const express = require('express');
const router = express.Router();
const { register, login, logout, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword/:id/:token', resetPassword);


module.exports = router;
