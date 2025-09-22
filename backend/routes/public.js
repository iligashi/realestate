const express = require('express');
const router = express.Router();

// ==================== PUBLIC ANNOUNCEMENTS ====================
// Get public announcements for home page
router.get('/announcements', async (req, res) => {
  try {
    const Announcement = require('../models/Announcement');
    const announcements = await Announcement.find({ 
      isActive: true,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: { $exists: false } }
      ]
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(5)
    .select('title content type priority');

    res.json({ announcements });
  } catch (error) {
    console.error('Get public announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
});

module.exports = router;
