const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Placeholder for messages routes
router.get('/', auth, (req, res) => {
  res.json({ message: 'Messages routes - to be implemented' });
});

module.exports = router;
