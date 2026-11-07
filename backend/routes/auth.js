const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const upload = require('../middleware/upload');
const { authRateLimit } = require('../middleware/rateLimiter');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  extendSession,
  logout
} = require('../controllers/authController');

// Public routes (no authentication required)
router.post('/register', authRateLimit, validateRegistration, register);
router.post('/login', authRateLimit, validateLogin, login);

// Protected routes (authentication required)
router.get('/profile', auth, getProfile);
router.put('/profile', auth, upload.single('profilePicture'), updateProfile);
router.put('/change-password', auth, changePassword);
router.post('/extend-session', auth, extendSession);
router.post('/logout', logout);

module.exports = router;
