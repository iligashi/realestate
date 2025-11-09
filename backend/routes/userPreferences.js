const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getPropertyAlerts,
  createPropertyAlert,
  updatePropertyAlert,
  deletePropertyAlert
} = require('../controllers/userPreferenceController');

router.use(auth);

// Saved searches
router.get('/saved-searches', getSavedSearches);
router.post('/saved-searches', createSavedSearch);
router.put('/saved-searches/:searchId', updateSavedSearch);
router.delete('/saved-searches/:searchId', deleteSavedSearch);

// Property alerts
router.get('/property-alerts', getPropertyAlerts);
router.post('/property-alerts', createPropertyAlert);
router.put('/property-alerts/:alertId', updatePropertyAlert);
router.delete('/property-alerts/:alertId', deletePropertyAlert);

module.exports = router;

