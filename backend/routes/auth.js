const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { imageUpload } = require('../utils/imageUpload');

const profilePicture = imageUpload({ folder: 'profiles', field: 'profilePicture', maxSizeMB: 5 });
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
router.put('/profile', auth, profilePicture, updateProfile);
router.put('/change-password', auth, changePassword);
router.post('/extend-session', auth, extendSession);
router.post('/logout', logout);

module.exports = router;
