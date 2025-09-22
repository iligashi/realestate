const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/admin');
const {
  // User Management
  getAllUsers, updateUser, deleteUser,
  
  // Listing Management
  getAllListings, updateListingStatus, deleteListing,
  
  // Reports & Moderation
  getAllReports, resolveReport,
  
  // Dashboard Analytics
  getDashboardAnalytics,
  
  // NEW: Platform Settings
  getPlatformSettings, updatePlatformSettings,
  
  // NEW: Featured Listings
  getFeaturedListings, updateFeaturedListing,
  
  // NEW: System Announcements
  getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  
  // NEW: Enhanced Analytics
  getEnhancedAnalytics,
  
  // NEW: Revenue Analytics
  getRevenueAnalytics
} = require('../controllers/adminController');

// ==================== PROTECTED ROUTES (Authentication + Admin Required) ====================
// Apply authentication and admin authorization to all routes below
router.use(auth);
router.use(adminAuth);

// ==================== DASHBOARD & ANALYTICS ====================
router.get('/dashboard', getDashboardAnalytics);
router.get('/analytics/enhanced', getEnhancedAnalytics);
router.get('/analytics/revenue', getRevenueAnalytics);

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

// ==================== NEW: PLATFORM SETTINGS ====================
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

// ==================== NEW: FEATURED LISTINGS ====================
router.get('/listings/featured', getFeaturedListings);
router.patch('/listings/:id/featured', updateFeaturedListing);

// ==================== NEW: SYSTEM ANNOUNCEMENTS ====================
router.get('/announcements', getAllAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

module.exports = router;
