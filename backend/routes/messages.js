const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createMessage,
  createRentalMessage,
  getMessages,
  getMessageThread,
  replyToMessage,
  markAsRead,
  getUnreadCount,
  closeMessage,
  deleteMessageThread,
  getPropertyConversations
} = require('../controllers/messageController');

// All routes require authentication
router.use(auth);

// Create a new message (buyer contacting seller)
router.post('/', createMessage);

// Create a new rental message (renter contacting landlord)
router.post('/rental', createRentalMessage);

// Get messages for the authenticated user
router.get('/', getMessages);

// Get unread message count for notifications
router.get('/unread-count', getUnreadCount);

// Get a specific message thread/conversation
router.get('/:messageId', getMessageThread);

// Get conversations for a specific property
router.get('/property/:propertyId', getPropertyConversations);

// Reply to a message
router.post('/:messageId/reply', replyToMessage);

// Mark message as read
router.patch('/:messageId/read', markAsRead);

// Close a message thread
router.patch('/:messageId/close', closeMessage);

// Delete a message thread/conversation
router.delete('/:messageId', deleteMessageThread);

module.exports = router;