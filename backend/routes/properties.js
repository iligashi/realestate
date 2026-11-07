const express = require('express');
const router = express.Router();
const { auth, optionalAuth, requireRole } = require('../middleware/auth');
const { validateProperty } = require('../middleware/validation');
const { imageUpload } = require('../utils/imageUpload');

const propertyImages = imageUpload({ folder: 'property-images', field: 'images', maxFiles: 10 });
const parseFormData = require('../middleware/parseFormData');
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getUserProperties
} = require('../controllers/propertyController');

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Public routes (no authentication required)
router.get('/', getProperties);
router.get('/:id', optionalAuth, getProperty);

// Protected routes (authentication required)
router.get('/user/my-properties', auth, getUserProperties);

// Create property with error handling
router.post('/', 
  auth, 
  propertyImages,
  parseFormData, 
  validateProperty, // Added back now that parsing is fixed
  asyncHandler(createProperty)
);

// Update property with error handling
router.put('/:id', 
  auth, 
  propertyImages,
  parseFormData, 
  validateProperty, // Added back now that parsing is fixed
  asyncHandler(updateProperty)
);

router.delete('/:id', auth, deleteProperty);

module.exports = router;
