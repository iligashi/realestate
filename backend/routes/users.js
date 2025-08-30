const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserBlock,
  getUserStats
} = require('../controllers/userController');

// Public routes (no authentication required)
// None for users

// Protected routes (authentication required)
router.get('/stats', auth, requireRole(['admin']), getUserStats);
router.get('/', auth, requireRole(['admin']), getAllUsers);
router.get('/:id', auth, getUserById);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, requireRole(['admin']), deleteUser);
router.patch('/:id/toggle-block', auth, requireRole(['admin']), toggleUserBlock);

module.exports = router;
