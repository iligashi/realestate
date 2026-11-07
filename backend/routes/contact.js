const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const ContactMessage = require('../models/ContactMessage');
const { optionalAuth, auth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// A handful of messages per hour is plenty for a real person
const contactLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  message: { error: 'Too many messages. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post(
  '/',
  contactLimit,
  optionalAuth,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Please enter your name'),
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('subject').optional().isIn(['general', 'listing', 'account', 'report', 'partnership']),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters'),
    validate
  ],
  async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      await ContactMessage.create({ name, email, subject, message, user: req.user?._id });
      res.status(201).json({ message: 'Thanks! We will get back to you within one business day.' });
    } catch (error) {
      logger.error('Contact message error:', error);
      res.status(500).json({ error: 'Could not send your message. Please try again.' });
    }
  }
);

// Admins read incoming messages
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(100);
    res.json({ messages });
  } catch (error) {
    logger.error('List contact messages error:', error);
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

module.exports = router;
