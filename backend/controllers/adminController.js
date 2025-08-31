const User = require('../models/User');
const Property = require('../models/Property');
const Report = require('../models/Report');
const Announcement = require('../models/Announcement');
const PlatformSettings = require('../models/PlatformSettings');

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

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
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

    const users = await User.find(filter)
      .select('-password')
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await User.countDocuments(filter);

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

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

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

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Also delete associated properties and reports
    await Property.deleteMany({ owner: id });
    await Report.deleteMany({ reportedBy: id });

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

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) filter.status = status;
    if (propertyType) filter.propertyType = propertyType;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const listings = await Property.find(filter)
      .populate('owner', 'firstName lastName email')
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Property.countDocuments(filter);

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

    const listing = await Property.findByIdAndUpdate(
      id,
      { 
        status,
        adminNotes,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    res.json({
      message: 'Listing status updated successfully',
      listing
    });
  } catch (error) {
    console.error('Update listing status error:', error);
    res.status(500).json({ error: 'Failed to update listing status.' });
  }
};

// Delete listing
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Property.findByIdAndDelete(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Also delete associated reports
    await Report.deleteMany({ reportedItem: id, reportedItemModel: 'Property' });

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
      filter.reason = { $regex: search, $options: 'i' };
    }
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { priority: -1, createdAt: -1 }
    };

    const reports = await Report.find(filter)
      .populate('reportedBy', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName')
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Report.countDocuments(filter);

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

    const report = await Report.findByIdAndUpdate(
      id,
      {
        status,
        action,
        adminNotes,
        resolvedBy: req.user._id,
        resolvedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'firstName lastName email')
     .populate('resolvedBy', 'firstName lastName');

    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    res.json({
      message: 'Report resolved successfully',
      report
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
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isBlocked: false });
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    // Listing statistics
    const totalListings = await Property.countDocuments();
    const pendingListings = await Property.countDocuments({ status: 'pending' });
    const approvedListings = await Property.countDocuments({ status: 'approved' });
    const rejectedListings = await Property.countDocuments({ status: 'rejected' });

    // Report statistics
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });

    // Role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$userType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName userType createdAt');

    const recentListings = await Property.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status propertyType createdAt')
      .populate('owner', 'firstName lastName');

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
    const featuredListings = await Property.find({ isFeatured: true })
      .populate('owner', 'firstName lastName email')
      .sort({ featuredAt: -1 });

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

    const listing = await Property.findByIdAndUpdate(
      id,
      {
        isFeatured,
        featuredAt: isFeatured ? new Date() : null,
        featuredUntil,
        featuredPrice
      },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    res.json({
      message: 'Featured listing updated successfully',
      listing
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

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) filter.type = type;
    if (isActive !== '') filter.isActive = isActive === 'true';

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { priority: -1, createdAt: -1 }
    };

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'firstName lastName')
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Announcement.countDocuments(filter);

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
      createdBy: req.user._id
    };

    const announcement = await Announcement.create(announcementData);
    await announcement.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
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

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    res.json({
      message: 'Announcement updated successfully',
      announcement
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

    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

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
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Listing performance data
    const listingPerformance = await Property.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          totalViews: { $sum: '$views' || 0 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Geographic data
    const geographicData = await Property.aggregate([
      {
        $match: {
          'address.city': { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$address.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Trends
    const trends = {
      topPropertyTypes: await Property.aggregate([
        { $group: { _id: '$propertyType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      topLocations: await Property.aggregate([
        { $match: { 'address.city': { $exists: true, $ne: '' } } },
        { $group: { _id: '$address.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
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
