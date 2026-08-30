const express = require('express');
const router = express.Router();

// ==================== PUBLIC ANNOUNCEMENTS ====================
// Get public announcements for home page
router.get('/announcements', async (req, res) => {
  try {
    const { Announcement } = require('../models');
    const { Op } = require('sequelize');
    
    const announcements = await Announcement.findAll({
      where: {
        isActive: true
      },
      order: [['priority', 'DESC'], ['createdAt', 'DESC']],
      limit: 5,
      attributes: ['title', 'content', 'type', 'priority']
    });

    res.json({ announcements });
  } catch (error) {
    console.error('Get public announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
});

module.exports = router;
