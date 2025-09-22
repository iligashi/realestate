const { validationResult } = require('express-validator');
const { body } = require('express-validator');

// Middleware to check for validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Validation rules for user registration
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('userType')
    .isIn(['buyer', 'seller', 'renter', 'agent', 'admin'])
    .withMessage('Invalid user type'),
  validate
];

// Validation rules for user login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Validation rules for property creation
const validateProperty = [
  (req, res, next) => {
    console.log('=== validateProperty middleware ===');
    console.log('Validating parsed body:', req.body);
    
    try {
      const errors = [];
      
      // Check required fields
      if (!req.body.title || req.body.title.trim().length < 10) {
        errors.push('Title must be at least 10 characters long');
      }
      
      if (!req.body.description || req.body.description.trim().length < 50) {
        errors.push('Description must be at least 50 characters long');
      }
      
      if (!req.body.propertyType || !['house', 'apartment', 'office'].includes(req.body.propertyType)) {
        errors.push('Invalid property type');
      }
      
      if (!req.body.listingType || !['sale', 'rent', 'rental', 'auction', 'pre-construction'].includes(req.body.listingType)) {
        errors.push('Invalid listing type');
      }
      
      if (!req.body.price || req.body.price <= 0) {
        errors.push('Price must be a positive number');
      }
      
      if (!req.body.address || !req.body.address.city || req.body.address.city.trim() === '') {
        errors.push('City is required');
      }
      
      if (!req.body.address || !req.body.address.country || req.body.address.country.trim() === '') {
        errors.push('Country is required');
      }
      
      if (!req.body.location || !req.body.location.coordinates || !Array.isArray(req.body.location.coordinates)) {
        errors.push('Location coordinates are required');
      }
      
      // Validate rental details if listing type is rental
      if (req.body.listingType === 'rental') {
        if (!req.body.rentalDetails) {
          errors.push('Rental details are required for rental properties');
        } else {
          if (!req.body.rentalDetails.monthlyRent || req.body.rentalDetails.monthlyRent <= 0) {
            errors.push('Monthly rent is required and must be greater than 0');
          }
          
          if (!req.body.rentalDetails.availableFrom) {
            errors.push('Available from date is required for rental properties');
          }
          
          if (!req.body.rentalDetails.availableUntil) {
            errors.push('Available until date is required for rental properties');
          }
          
          if (!req.body.rentalDetails.minimumLeaseMonths || req.body.rentalDetails.minimumLeaseMonths < 1) {
            errors.push('Minimum lease duration must be at least 1 month');
          }
        }
      }
      
      if (errors.length > 0) {
        console.log('Validation errors:', errors);
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }
      
      console.log('Validation passed successfully');
      console.log('=== End validateProperty middleware ===');
      next();
      
    } catch (error) {
      console.error('Error in validation middleware:', error);
      res.status(500).json({
        error: 'Validation error',
        details: error.message
      });
    }
  }
];

// Validation rules for rental application
const validateRentalApplication = (req, res, next) => {
  console.log('=== validateRentalApplication middleware ===');
  console.log('Validating rental application:', req.body);
  
  try {
    const errors = [];
    
    // Personal Information validation
    if (!req.body.personalInfo) {
      errors.push('Personal information is required');
    } else {
      const { personalInfo } = req.body;
      if (!personalInfo.firstName || personalInfo.firstName.trim() === '') {
        errors.push('First name is required');
      }
      if (!personalInfo.lastName || personalInfo.lastName.trim() === '') {
        errors.push('Last name is required');
      }
      if (!personalInfo.email || !personalInfo.email.includes('@')) {
        errors.push('Valid email is required');
      }
      if (!personalInfo.phone || personalInfo.phone.trim() === '') {
        errors.push('Phone number is required');
      }
      if (!personalInfo.dateOfBirth) {
        errors.push('Date of birth is required');
      }
    }

    // Rental Information validation
    if (!req.body.rentalInfo) {
      errors.push('Rental information is required');
    } else {
      const { rentalInfo } = req.body;
      if (!rentalInfo.desiredMoveInDate) {
        errors.push('Desired move-in date is required');
      }
      if (!rentalInfo.leaseDuration || rentalInfo.leaseDuration < 1) {
        errors.push('Valid lease duration is required');
      }
    }

    // Employment validation (optional but if provided, validate)
    if (req.body.employment) {
      const { employment } = req.body;
      if (employment.monthlyIncome && employment.monthlyIncome < 0) {
        errors.push('Monthly income must be positive');
      }
    }

    // Financial validation (optional but if provided, validate)
    if (req.body.financialInfo) {
      const { financialInfo } = req.body;
      if (financialInfo.annualIncome && financialInfo.annualIncome < 0) {
        errors.push('Annual income must be positive');
      }
      if (financialInfo.creditScore && (financialInfo.creditScore < 300 || financialInfo.creditScore > 850)) {
        errors.push('Credit score must be between 300 and 850');
      }
    }
    
    if (errors.length > 0) {
      console.log('Rental application validation errors:', errors);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    console.log('Rental application validation passed successfully');
    console.log('=== End validateRentalApplication middleware ===');
    next();
    
  } catch (error) {
    console.error('Error in rental application validation middleware:', error);
    res.status(500).json({
      error: 'Validation error',
      details: error.message
    });
  }
};

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validateProperty,
  validateRentalApplication
};
