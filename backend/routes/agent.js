const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { getDashboard, getListings, updateListingStatus } = require('../controllers/agentController');

const router = express.Router();

router.use(auth, requireRole(['agent', 'admin']));

router.get('/dashboard', getDashboard);
router.get('/listings', getListings);
router.patch('/listings/:id/status', updateListingStatus);

module.exports = router;
