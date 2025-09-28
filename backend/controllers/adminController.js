const { User, Property, Report, Announcement, PlatformSettings } = require('../models');
const { Op } = require('sequelize');

// ==================== USER MANAGEMENT ====================

// Get all users with filters
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = ''
    } = req.query;

    // Build filter object for Sequelize
    const filter = {};
    
    if (search) {
      filter[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role) filter.userType = role;
    if (status === 'active') filter.isBlocked = false;
    if (status === 'blocked') filter.isBlocked = true;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const users = await User.findAll({
      where: filter,
      attributes: { exclude: ['password'] },
      limit: options.limit,
      offset: (options.page - 1) * options.limit,
      order: [['created_at', 'DESC']]
    });

    const total = await User.count({ where: filter });

    res.json({
      users,
      total,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

// Update user (role, status, etc.)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent updating sensitive fields
    delete updateData.password;
    delete updateData.email; // Email should be updated through separate process

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.update(updateData);

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.destroy();

    // Also delete associated properties and reports
    await Property.destroy({ where: { ownerId: id } });
    await Report.destroy({ where: { reportedBy: id } });

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
};

// ==================== LISTING MANAGEMENT ====================

// Get all listings with filters
const getAllListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      propertyType = ''
    } = req.query;

    // Build filter object for Sequelize
    const filter = {};
    
    if (search) {
      filter[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { '$address.city$': { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) filter.status = status;
    if (propertyType) filter.propertyType = propertyType;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const listings = await Property.findAll({
      where: filter,
      include: [{ model: User, as: 'owner', attributes: ['first_name', 'last_name', 'email'] }],
      limit: options.limit,
      offset: (options.page - 1) * options.limit,
      order: [['created_at', 'DESC']]
    });

    const total = await Property.count({ where: filter });

    res.json({
      listings,
      total,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page
    });
  } catch (error) {
    console.error('Get all listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings.' });
  }
};

// Update listing status (approve/reject)
const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    console.log('Update listing status request:', { id, status, adminNotes });

    // Validate ObjectId format
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'Invalid property ID format. ID must be a valid MongoDB ObjectId.'
      });
    }

    // Validate status
    const validStatuses = ['active', 'pending', 'sold', 'rented', 'inactive', 'under-contract'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const listing = await Property.findByPk(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    await listing.update({
      status,
      admin_notes: adminNotes,
      reviewed_by: req.user.id,
      reviewed_at: new Date()
    });

    const listingWithOwner = await Property.findByPk(id, {
      include: [{ model: User, as: 'owner', attributes: ['first_name', 'last_name', 'email'] }]
    });

    res.json({
      message: 'Listing status updated successfully',
      listing: listingWithOwner
    });
  } catch (error) {
    console.error('Update listing status error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to update listing status.',
      details: error.message
    });
  }
};

// Delete listing
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Property.findByPk(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    await listing.destroy();

    // Also delete associated reports
    await Report.destroy({ where: { reported_item: id, reported_item_model: 'Property' } });

    res.json({ message: 'Listing deleted successfully.' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
};

// ==================== REPORTS & MODERATION ====================

// Get all reports with filters
const getAllReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      type = '',
      priority = ''
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.reason = { [Op.like]: `%${search}%` };
    }
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { priority: -1, createdAt: -1 }
    };

    const reports = await Report.findAll({
      where: filter,
      include: [
        { model: User, as: 'reporter', attributes: ['firstName', 'lastName', 'email'] },
        { model: User, as: 'resolver', attributes: ['firstName', 'lastName'] }
      ],
      limit: options.limit,
      offset: (options.page - 1) * options.limit,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    });

    const total = await Report.count({ where: filter });

    res.json({
      reports,
      total,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};

// Resolve report
const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action, adminNotes } = req.body;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    await report.update({
      status,
      action,
      admin_notes: adminNotes,
      resolved_by: req.user.id,
      resolved_at: new Date()
    });

    const reportWithUsers = await Report.findByPk(id, {
      include: [
        { model: User, as: 'reporter', attributes: ['first_name', 'last_name', 'email'] },
        { model: User, as: 'resolver', attributes: ['first_name', 'last_name'] }
      ]
    });

    res.json({
      message: 'Report resolved successfully',
      report: reportWithUsers
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ error: 'Failed to resolve report.' });
  }
};

// ==================== DASHBOARD ANALYTICS ====================

// Get dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isBlocked: false } });
    const blockedUsers = await User.count({ where: { isBlocked: true } });

    // Listing statistics
    const totalListings = await Property.count();
    const pendingListings = await Property.count({ where: { status: 'pending' } });
    const approvedListings = await Property.count({ where: { status: 'approved' } });
    const rejectedListings = await Property.count({ where: { status: 'rejected' } });

    // Report statistics
    const totalReports = await Report.count();
    const pendingReports = await Report.count({ where: { status: 'pending' } });
    const resolvedReports = await Report.count({ where: { status: 'resolved' } });

    // Role distribution - using raw query for aggregation
    const roleDistribution = await User.findAll({
      attributes: [
        'userType',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['userType'],
      order: [[User.sequelize.fn('COUNT', User.sequelize.col('id')), 'DESC']],
      raw: true
    });

    // Recent activity
    const recentUsers = await User.findAll({
      attributes: ['firstName', 'lastName', 'userType', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const recentListings = await Property.findAll({
      attributes: ['title', 'status', 'propertyType', 'createdAt'],
      include: [{ model: User, as: 'owner', attributes: ['firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      users: { total: totalUsers, active: activeUsers, blocked: blockedUsers },
      listings: { total: totalListings, pending: pendingListings, approved: approvedListings, rejected: rejectedListings },
      reports: { total: totalReports, pending: pendingReports, resolved: resolvedReports },
      roleDistribution,
      recentUsers,
      recentListings
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics.' });
  }
};

// ==================== NEW: PLATFORM SETTINGS ====================

// Get platform settings
const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get platform settings error:', error);
    res.status(500).json({ error: 'Failed to fetch platform settings.' });
  }
};

// Update platform settings
const updatePlatformSettings = async (req, res) => {
  try {
    const updateData = req.body;
    const settings = await PlatformSettings.getSettings();
    
    // Update the settings
    Object.keys(updateData).forEach(section => {
      if (settings[section] && typeof updateData[section] === 'object') {
        settings[section] = { ...settings[section], ...updateData[section] };
      }
    });
    
    await settings.save();
    
    res.json({
      message: 'Platform settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update platform settings error:', error);
    res.status(500).json({ error: 'Failed to update platform settings.' });
  }
};

// ==================== NEW: FEATURED LISTINGS ====================

// Get featured listings
const getFeaturedListings = async (req, res) => {
  try {
    const featuredListings = await Property.findAll({
      where: { is_featured: true },
      include: [{ model: User, as: 'owner', attributes: ['first_name', 'last_name', 'email'] }],
      order: [['featured_at', 'DESC']]
    });

    res.json({
      listings: featuredListings,
      total: featuredListings.length
    });
  } catch (error) {
    console.error('Get featured listings error:', error);
    res.status(500).json({ error: 'Failed to fetch featured listings.' });
  }
};

// Update featured listing
const updateFeaturedListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured, featuredUntil, featuredPrice } = req.body;

    const listing = await Property.findByPk(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    await listing.update({
      is_featured: isFeatured,
      featured_at: isFeatured ? new Date() : null,
      featured_until: featuredUntil,
      featured_price: featuredPrice
    });

    const listingWithOwner = await Property.findByPk(id, {
      include: [{ model: User, as: 'owner', attributes: ['first_name', 'last_name', 'email'] }]
    });

    res.json({
      message: 'Featured listing updated successfully',
      listing: listingWithOwner
    });
  } catch (error) {
    console.error('Update featured listing error:', error);
    res.status(500).json({ error: 'Failed to update featured listing.' });
  }
};

// ==================== NEW: SYSTEM ANNOUNCEMENTS ====================

// Get all announcements
const getAllAnnouncements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      isActive = ''
    } = req.query;

    // Build filter object for Sequelize
    const filter = {};
    
    if (search) {
      filter[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (type) filter.type = type;
    if (isActive !== '') filter.is_active = isActive === 'true';

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { priority: -1, createdAt: -1 }
    };

    const announcements = await Announcement.findAll({
      where: filter,
      include: [{ model: User, as: 'creator', attributes: ['firstName', 'lastName'] }],
      limit: options.limit,
      offset: (options.page - 1) * options.limit,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    });

    const total = await Announcement.count({ where: filter });

    res.json({
      announcements,
      total,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page
    });
  } catch (error) {
    console.error('Get all announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
};

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      createdBy: req.user.id
    };

    const announcement = await Announcement.create(announcementData);
    const announcementWithUser = await Announcement.findByPk(announcement.id, {
      include: [{ model: User, as: 'creator', attributes: ['firstName', 'lastName'] }]
    });

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: announcementWithUser
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    await announcement.update(updateData);

    const announcementWithUser = await Announcement.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: ['firstName', 'lastName'] }]
    });

    res.json({
      message: 'Announcement updated successfully',
      announcement: announcementWithUser
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement.' });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    await announcement.destroy();

    res.json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
};

// ==================== NEW: ENHANCED ANALYTICS ====================

// Get enhanced analytics
const getEnhancedAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1);

    // User growth data
    const userGrowth = await User.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Listing performance data
    const listingPerformance = await Property.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('views')), 'totalViews']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Geographic data
    const geographicData = await Property.findAll({
      where: {
        '$address.city$': {
          [Op.ne]: null,
          [Op.ne]: ''
        }
      },
      attributes: [
        [sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(address, '$.city'))"), 'city'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(address, '$.city'))")],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Trends
    const trends = {
      topPropertyTypes: await Property.findAll({
        attributes: [
          'propertyType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['propertyType'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 5,
        raw: true
      }),
      topLocations: await Property.findAll({
        where: {
          '$address.city$': {
            [Op.ne]: null,
            [Op.ne]: ''
          }
        },
        attributes: [
          [sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(address, '$.city'))"), 'city'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.literal("JSON_UNQUOTE(JSON_EXTRACT(address, '$.city'))")],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 5,
        raw: true
      })
    };

    res.json({
      userGrowth,
      listingPerformance,
      geographicData,
      trends
    });
  } catch (error) {
    console.error('Get enhanced analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced analytics.' });
  }
};

// ==================== NEW: REVENUE ANALYTICS ====================

// Get revenue analytics
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1);

    // Mock revenue data (replace with actual payment processing data)
    const totalRevenue = 15420.50;
    const commissionEarnings = 771.03;
    const featuredListingRevenue = 1249.99;

    // Monthly revenue breakdown
    const monthlyRevenue = [
      { month: 'Jan', revenue: 1250.00 },
      { month: 'Feb', revenue: 1380.50 },
      { month: 'Mar', revenue: 1420.75 },
      { month: 'Apr', revenue: 1580.25 },
      { month: 'May', revenue: 1620.00 },
      { month: 'Jun', revenue: 1750.30 }
    ];

    res.json({
      totalRevenue,
      commissionEarnings,
      featuredListingRevenue,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics.' });
  }
};

module.exports = {
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
  
  // Dashboard Analytics
  getDashboardAnalytics,
  
  // Platform Settings
  getPlatformSettings,
  updatePlatformSettings,
  
  // Featured Listings
  getFeaturedListings,
  updateFeaturedListing,
  
  // System Announcements
  getAllAnnouncements: getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  
  // Enhanced Analytics
  getEnhancedAnalytics,
  
  // Revenue Analytics
  getRevenueAnalytics
};
