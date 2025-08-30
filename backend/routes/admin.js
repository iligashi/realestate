const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/admin');
const {
  // User Management
  getAllUsers,
  updateUser,
  deleteUser,
  
  // Listing Management
  getAllListings,
  updateListingStatus,
  deleteListing,
  
  // Reports & Moderation
  getAllReports,
  resolveReport,
  
  // Analytics & Dashboard
  getDashboardAnalytics
} = require('../controllers/adminController');

// Apply authentication and admin authorization to all routes
router.use(auth);
router.use(adminAuth);

// ==================== DASHBOARD & ANALYTICS ====================
router.get('/dashboard', getDashboardAnalytics);

// ==================== USER MANAGEMENT ====================
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// ==================== LISTING MANAGEMENT ====================
router.get('/listings', getAllListings);
router.patch('/listings/:id/status', updateListingStatus);
router.delete('/listings/:id', deleteListing);

// ==================== REPORTS & MODERATION ====================
router.get('/reports', getAllReports);
router.patch('/reports/:id/resolve', resolveReport);

module.exports = router;
