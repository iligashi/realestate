const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Placeholder for notifications routes
router.get('/', auth, (req, res) => {
  res.json({ message: 'Notifications routes - to be implemented' });
});

module.exports = router;
