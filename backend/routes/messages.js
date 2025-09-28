const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createMessage,
  createRentalInquiry,
  getMessages,
  replyToMessage,
  markAsRead,
  getUnreadCount,
  closeMessage
} = require('../controllers/messageController');

// All routes require authentication
router.use(auth);

// Create a new message (buyer contacting seller)
router.post('/', createMessage);

// Create a new rental message (renter contacting landlord)
router.post('/rental', createRentalInquiry);

// Get messages for the authenticated user
router.get('/', getMessages);

// Get unread message count for notifications
router.get('/unread-count', getUnreadCount);

// Get a specific message thread (using getMessages with ID filter)
// router.get('/:messageId', getMessageThread);

// Reply to a message
router.post('/:messageId/reply', replyToMessage);

// Mark message as read
router.patch('/:messageId/read', markAsRead);

// Close a message thread
router.patch('/:messageId/close', closeMessage);

module.exports = router;