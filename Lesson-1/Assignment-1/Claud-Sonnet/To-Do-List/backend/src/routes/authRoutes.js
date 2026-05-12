const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken, getMe, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, passwordLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', passwordLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
