const express = require('express');
const logger = require('../utils/logger');
const Announcement = require('../models/Announcement');
const { optionalAuth } = require('../middleware/auth');
const { getSettings, isMaintenanceActive } = require('../utils/settings');
const { listAgents, getAgentProfile } = require('../controllers/agentController');

const router = express.Router();

// userType -> announcement audience value
const AUDIENCE_FOR = { buyer: 'buyers', seller: 'sellers', agent: 'agents', renter: 'renters' };
const PRIORITY_RANK = { urgent: 4, high: 3, medium: 2, low: 1 };

// ==================== PUBLIC ANNOUNCEMENTS ====================
// Live announcements: active, inside their schedule window, and aimed at
// everyone or at the signed-in user's role. Pinned first, then by priority.
router.get('/announcements', optionalAuth, async (req, res) => {
  try {
    const now = new Date();
    const audiences = ['all'];
    const role = req.user?.userType;
    if (role === 'admin') audiences.push(...Object.values(AUDIENCE_FOR));
    else if (AUDIENCE_FOR[role]) audiences.push(AUDIENCE_FOR[role]);

    const announcements = await Announcement.find({
      isActive: true,
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gt: now } }] },
        { $or: [{ targetAudience: { $in: audiences } }, { targetAudience: { $exists: false } }, { targetAudience: { $size: 0 } }] },
      ],
    })
      .select('title content type priority isPinned startDate endDate')
      .lean();

    announcements.sort(
      (a, b) =>
        Number(b.isPinned) - Number(a.isPinned) ||
        (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0) ||
        new Date(b.startDate || 0) - new Date(a.startDate || 0)
    );

    res.json({ announcements: announcements.slice(0, 5) });
  } catch (error) {
    logger.error('Get public announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
});

// ==================== PUBLIC SETTINGS ====================
// Only what the frontend needs to render; never business or security values.
router.get('/settings', async (req, res) => {
  try {
    const s = await getSettings();
    res.json({
      settings: {
        general: {
          siteName: s.general?.siteName,
          siteDescription: s.general?.siteDescription,
          contactEmail: s.general?.contactEmail,
          contactPhone: s.general?.contactPhone,
          address: s.general?.address,
          socialMedia: s.general?.socialMedia,
        },
        features: {
          enableMessaging: s.features?.enableMessaging !== false,
          enableReviews: s.features?.enableReviews !== false,
          allowRenterListings: s.features?.allowRenterListings !== false,
          requireListingApproval: s.features?.requireListingApproval !== false,
          maxImagesPerListing: s.features?.maxImagesPerListing,
        },
        maintenance: {
          active: isMaintenanceActive(s),
          message: s.maintenance?.maintenanceMessage || '',
          endsAt: s.maintenance?.maintenanceEndTime || null,
        },
      },
    });
  } catch (error) {
    logger.error('Get public settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// ==================== AGENTS DIRECTORY ====================
router.get('/agents', listAgents);
router.get('/agents/:id', getAgentProfile);

module.exports = router;
