const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { validateProperty } = require('../middleware/validation');
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getUserProperties
} = require('../controllers/propertyController');

// Public routes (no authentication required)
router.get('/', getProperties);
router.get('/:id', getProperty);

// Protected routes (authentication required)
router.get('/user/my-properties', auth, getUserProperties);
router.post('/', auth, validateProperty, createProperty);
router.put('/:id', auth, validateProperty, updateProperty);
router.delete('/:id', auth, deleteProperty);

module.exports = router;
