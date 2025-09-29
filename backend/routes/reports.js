const express = require('express');
const router = express.Router();
const { createReport, getMyReports, getReportsAgainstMe, getReport } = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create a new report
router.post('/', createReport);

// Get user's own reports
router.get('/my-reports', getMyReports);

// Get reports made against the user
router.get('/against-me', getReportsAgainstMe);

// Get specific report by ID
router.get('/:id', getReport);

module.exports = router;
