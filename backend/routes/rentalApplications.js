const express = require('express');
const router = express.Router();
const {
  createRentalApplication,
  getLandlordApplications,
  getApplicantApplications,
  getApplication,
  updateApplicationStatus,
  addApplicationMessage,
  withdrawApplication
} = require('../controllers/rentalApplicationController');
const { validateRentalApplication } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// Create a new rental application
router.post('/:propertyId', auth, validateRentalApplication, createRentalApplication);

// Get applications for landlord
router.get('/landlord', auth, getLandlordApplications);

// Get applications for applicant
router.get('/applicant', auth, getApplicantApplications);

// Get specific application
router.get('/:applicationId', auth, getApplication);

// Update application status (approve/reject)
router.patch('/:applicationId/status', auth, updateApplicationStatus);

// Add message to application
router.post('/:applicationId/messages', auth, addApplicationMessage);

// Withdraw application
router.patch('/:applicationId/withdraw', auth, withdrawApplication);

module.exports = router;
