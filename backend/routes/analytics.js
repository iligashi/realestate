const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

// Placeholder for analytics routes
router.get('/', auth, requireRole(['admin']), (req, res) => {
  res.json({ message: 'Analytics routes - to be implemented' });
});

module.exports = router;
