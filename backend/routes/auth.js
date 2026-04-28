const express = require('express');
const router  = express.Router();
const { login, verifyPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login',           login);
router.post('/verify-password', verifyToken, verifyPassword); // protected

module.exports = router;
