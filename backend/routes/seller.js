const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { imageUpload } = require('../utils/imageUpload');

const listingPhotos = imageUpload({ folder: 'property-images', field: 'photos', maxFiles: 10 });
const { sellerRateLimit, strictRateLimit } = require('../middleware/rateLimiter');
const sellerController = require('../controllers/sellerController');

// Apply rate limiting to all seller routes
router.use(sellerRateLimit);

// Apply authentication middleware to all routes
router.use(auth);
router.use(requireRole(['seller', 'admin']));

// ===== DASHBOARD =====
router.get('/dashboard', sellerController.getSellerDashboard);

// ===== PROPERTY LISTING WIZARD =====
router.post('/properties', listingPhotos, sellerController.createPropertyListing);
router.put('/properties/:id', listingPhotos, sellerController.updatePropertyListing);
router.put('/properties/:id/photos', sellerController.updatePropertyPhotos);

// ===== INQUIRY DASHBOARD =====
router.get('/inquiries', sellerController.getInquiries);
router.get('/inquiries/:id', sellerController.getInquiryDetails);
router.post('/inquiries/:id/respond', sellerController.respondToInquiry);

// ===== LISTING ANALYTICS =====
router.get('/analytics', sellerController.getListingAnalytics);
router.get('/analytics/:id', sellerController.getAnalyticsDetails);

// ===== PRICE CHANGE HISTORY =====
router.put('/properties/:id/price', sellerController.updatePropertyPrice);
router.get('/properties/:id/price-history', sellerController.getPriceHistory);

// ===== OPEN HOUSE SCHEDULING =====
router.post('/open-houses', sellerController.createOpenHouse);
router.get('/open-houses', strictRateLimit, sellerController.getOpenHouses);
router.put('/open-houses/:id', sellerController.updateOpenHouse);
router.delete('/open-houses/:id', sellerController.cancelOpenHouse);

// ===== WORKFLOW MANAGEMENT =====
router.put('/properties/:id/workflow', sellerController.updatePropertyWorkflow);

module.exports = router;
