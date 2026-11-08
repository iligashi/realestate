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
  closeMessage
} = require('../controllers/messageController');

// All routes require authentication
router.use(auth);

// Admins can switch off new conversations from platform settings
const { getSettings } = require('../utils/settings');
const messagingEnabled = async (req, res, next) => {
  try {
    const settings = await getSettings();
    if (settings.features?.enableMessaging === false) {
      return res.status(403).json({ error: 'Messaging is currently disabled.' });
    }
  } catch { /* fall through */ }
  next();
};

// Create a new message (buyer contacting seller)
router.post('/', messagingEnabled, createMessage);

// Create a new rental message (renter contacting landlord)
router.post('/rental', messagingEnabled, createRentalMessage);

// Get messages for the authenticated user
router.get('/', getMessages);

// Get unread message count for notifications
router.get('/unread-count', getUnreadCount);

// Get a specific message thread
router.get('/:messageId', getMessageThread);

// Reply to a message
router.post('/:messageId/reply', replyToMessage);

// Mark message as read
router.patch('/:messageId/read', markAsRead);

// Close a message thread
router.patch('/:messageId/close', closeMessage);

module.exports = router;