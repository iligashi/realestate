const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Placeholder for payments routes
router.get('/', auth, (req, res) => {
  res.json({ message: 'Payments routes - to be implemented' });
});

module.exports = router;
