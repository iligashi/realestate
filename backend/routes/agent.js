const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAgentDashboard,
  getClients,
  getClient,
  createClient,
  updateClient,
  addClientInteraction,
  getLeads,
  getLead,
  createLead,
  updateLead,
  addLeadInteraction,
  convertLeadToClient,
  getCommissions,
  createCommission,
  updateCommission,
  getMarketAnalyses,
  createMarketAnalysis,
  getAgentProfile,
  updateAgentProfile
} = require('../controllers/agentController');

// Apply authentication and agent role requirement to all routes
router.use(auth);
router.use(requireRole(['agent']));

// Dashboard
router.get('/dashboard', getAgentDashboard);

// Client Management
router.get('/clients', getClients);
router.get('/clients/:clientId', getClient);
router.post('/clients', createClient);
router.put('/clients/:clientId', updateClient);
router.post('/clients/:clientId/interactions', addClientInteraction);

// Lead Management
router.get('/leads', getLeads);
router.get('/leads/:leadId', getLead);
router.post('/leads', createLead);
router.put('/leads/:leadId', updateLead);
router.post('/leads/:leadId/interactions', addLeadInteraction);
router.post('/leads/:leadId/convert', convertLeadToClient);

// Commission Management
router.get('/commissions', getCommissions);
router.post('/commissions', createCommission);
router.put('/commissions/:commissionId', updateCommission);

// Market Analysis
router.get('/market-analyses', getMarketAnalyses);
router.post('/market-analyses', createMarketAnalysis);

// Professional Profile
router.get('/profile/:agentId', getAgentProfile);
router.put('/profile', upload.single('profilePicture'), updateAgentProfile);

module.exports = router;
