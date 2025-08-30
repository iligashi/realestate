const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const upload = require('../middleware/upload');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

// Public routes (no authentication required)
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes (authentication required)
router.get('/profile', auth, getProfile);
router.put('/profile', auth, upload.single('profilePicture'), updateProfile);
router.put('/change-password', auth, changePassword);
router.post('/logout', auth, logout);

module.exports = router;
