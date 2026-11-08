const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const Report = require('../models/Report');
const Announcement = require('../models/Announcement');
const PlatformSettings = require('../models/PlatformSettings');
const { searchRegex } = require('../utils/searchRegex');
const logger = require('../utils/logger');
const { clearSettingsCache } = require('../utils/settings');

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
        { firstName: searchRegex(search) },
        { lastName: searchRegex(search) },
        { email: searchRegex(search) }
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
    logger.error('Get all users error:', error);
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
    logger.error('Update user error:', error);
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
    logger.error('Delete user error:', error);
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
        { title: searchRegex(search) },
        { description: searchRegex(search) },
        { 'address.city': searchRegex(search) }
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
      .populate('agent', 'firstName lastName email agent.agency')
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
    logger.error('Get all listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings.' });
  }
};

// Update listing status (approve/reject)
const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    logger.debug('Update listing status request:', { id, status, adminNotes });

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
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

    const listing = await Property.findByIdAndUpdate(
      id,
      { 
        status,
        adminNotes,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email')
      .populate('agent', 'firstName lastName email agent.agency');

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    res.json({
      message: 'Listing status updated successfully',
      listing
    });
  } catch (error) {
    logger.error('Update listing status error:', error);
    logger.error('Error details:', {
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

    const listing = await Property.findByIdAndDelete(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Also delete associated reports
    await Report.deleteMany({ reportedItem: id, reportedItemModel: 'Property' });

    res.json({ message: 'Listing deleted successfully.' });
  } catch (error) {
    logger.error('Delete listing error:', error);
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
      filter.reason = searchRegex(search);
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
    logger.error('Get all reports error:', error);
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
    logger.error('Resolve report error:', error);
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
    const approvedListings = await Property.countDocuments({ status: 'active' });
    const rejectedListings = await Property.countDocuments({ status: 'inactive' });

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
    logger.error('Get dashboard analytics error:', error);
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
    logger.error('Get platform settings error:', error);
    res.status(500).json({ error: 'Failed to fetch platform settings.' });
  }
};

// Fields an admin may change, by section. Anything else in the body is ignored.
const SETTINGS_FIELDS = {
  general: ['siteName', 'siteDescription', 'contactEmail', 'contactPhone', 'address', 'socialMedia'],
  business: ['commissionRate', 'featuredListingPrice', 'currency', 'taxRate'],
  features: [
    'enableReviews', 'enableMessaging', 'enableNotifications', 'enableAdvancedSearch',
    'enableVirtualTours', 'maxImagesPerListing', 'maxListingsPerUser',
    'requireListingApproval', 'allowRenterListings',
  ],
  security: ['requireEmailVerification', 'maxLoginAttempts', 'sessionTimeout'],
  maintenance: ['isMaintenanceMode', 'maintenanceMessage', 'maintenanceStartTime', 'maintenanceEndTime'],
};
const NESTED_SETTINGS = { address: ['street', 'city', 'state', 'zipCode', 'country'], socialMedia: ['facebook', 'twitter', 'linkedin', 'instagram'] };

// Update platform settings
const updatePlatformSettings = async (req, res) => {
  try {
    const body = req.body || {};
    const settings = await PlatformSettings.getSettings();

    for (const [section, fields] of Object.entries(SETTINGS_FIELDS)) {
      const incoming = body[section];
      if (!incoming || typeof incoming !== 'object') continue;
      for (const field of fields) {
        if (incoming[field] === undefined) continue;
        if (NESTED_SETTINGS[field]) {
          if (typeof incoming[field] !== 'object' || incoming[field] === null) continue;
          for (const sub of NESTED_SETTINGS[field]) {
            if (incoming[field][sub] !== undefined) settings.set(`${section}.${field}.${sub}`, incoming[field][sub]);
          }
        } else {
          // Empty strings clear optional dates
          const value = incoming[field] === '' && /Time$/.test(field) ? null : incoming[field];
          settings.set(`${section}.${field}`, value);
        }
      }
    }

    const m = settings.maintenance || {};
    if (m.maintenanceStartTime && m.maintenanceEndTime && new Date(m.maintenanceEndTime) <= new Date(m.maintenanceStartTime)) {
      return res.status(400).json({ error: 'Maintenance end time must be after the start time.' });
    }

    await settings.save();
    clearSettingsCache();

    res.json({
      message: 'Platform settings updated successfully',
      settings
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Update platform settings error:', error);
    res.status(500).json({ error: 'Failed to update platform settings.' });
  }
};

// Assign an agent to sell/rent a listing, or remove the assignment (agentId: null)
const assignListingAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid property ID format.' });
    }

    let agent = null;
    if (agentId) {
      if (!mongoose.Types.ObjectId.isValid(agentId)) return res.status(400).json({ error: 'Invalid agent ID.' });
      agent = await User.findById(agentId).select('firstName lastName email userType isActive isBlocked agent.agency');
      if (!agent || agent.userType !== 'agent') return res.status(400).json({ error: 'The selected user is not an agent.' });
      if (!agent.isActive || agent.isBlocked) return res.status(400).json({ error: 'This agent account is inactive or blocked.' });
    }

    const listing = await Property.findByIdAndUpdate(
      id,
      agent ? { agent: agent._id, agency: agent.agent?.agency || undefined } : { $unset: { agent: 1, agency: 1 } },
      { new: true }
    )
      .populate('owner', 'firstName lastName email')
      .populate('agent', 'firstName lastName email agent.agency');
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    res.json({
      message: agent ? `Assigned ${agent.firstName} ${agent.lastName} to this listing` : 'Agent removed from this listing',
      listing
    });
  } catch (error) {
    logger.error('Assign listing agent error:', error);
    res.status(500).json({ error: 'Failed to assign agent.' });
  }
};

// Agents an admin can assign, with how many listings each already handles
const getAssignableAgents = async (req, res) => {
  try {
    const agents = await User.find({ userType: 'agent', isActive: true, isBlocked: { $ne: true } })
      .select('firstName lastName email agent.agency location.city')
      .sort({ firstName: 1 })
      .lean();
    const counts = await Property.aggregate([
      { $match: { agent: { $in: agents.map((a) => a._id) } } },
      { $group: { _id: '$agent', count: { $sum: 1 } } },
    ]);
    const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.json({ agents: agents.map((a) => ({ ...a, listingCount: byId[String(a._id)] || 0 })) });
  } catch (error) {
    logger.error('Get assignable agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agents.' });
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
    logger.error('Get featured listings error:', error);
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
    logger.error('Update featured listing error:', error);
    res.status(500).json({ error: 'Failed to update featured listing.' });
  }
};

// ==================== NEW: SYSTEM ANNOUNCEMENTS ====================

// Draft (switched off), Scheduled (starts later), Live, or Expired (ended).
const announcementState = (a, now = new Date()) => {
  if (!a.isActive) return 'draft';
  if (a.startDate && new Date(a.startDate) > now) return 'scheduled';
  if (a.endDate && new Date(a.endDate) <= now) return 'expired';
  return 'live';
};

const ANNOUNCEMENT_TYPES = ['general', 'maintenance', 'update', 'alert', 'promotion'];
const ANNOUNCEMENT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const ANNOUNCEMENT_AUDIENCES = ['all', 'buyers', 'sellers', 'agents', 'renters'];

// Pick and check the editable announcement fields. Returns { data } or { error }.
const announcementInput = (body, existing = null) => {
  const data = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.content !== undefined) data.content = String(body.content).trim();
  if (body.type !== undefined) {
    if (!ANNOUNCEMENT_TYPES.includes(body.type)) return { error: 'Invalid announcement type.' };
    data.type = body.type;
  }
  if (body.priority !== undefined) {
    if (!ANNOUNCEMENT_PRIORITIES.includes(body.priority)) return { error: 'Invalid priority.' };
    data.priority = body.priority;
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.isPinned !== undefined) data.isPinned = Boolean(body.isPinned);
  if (body.targetAudience !== undefined) {
    const list = (Array.isArray(body.targetAudience) ? body.targetAudience : [body.targetAudience]).filter(Boolean);
    if (!list.length || list.some((a) => !ANNOUNCEMENT_AUDIENCES.includes(a))) return { error: 'Invalid audience.' };
    data.targetAudience = list.includes('all') ? ['all'] : [...new Set(list)];
  }
  for (const key of ['startDate', 'endDate']) {
    if (body[key] === undefined) continue;
    if (body[key] === null || body[key] === '') {
      data[key] = key === 'startDate' ? new Date() : null;
      continue;
    }
    const d = new Date(body[key]);
    if (Number.isNaN(d.getTime())) return { error: `Invalid ${key === 'startDate' ? 'start' : 'end'} date.` };
    data[key] = d;
  }

  const title = data.title ?? existing?.title;
  const content = data.content ?? existing?.content;
  if (!title) return { error: 'Title is required.' };
  if (!content) return { error: 'Content is required.' };
  const start = data.startDate !== undefined ? data.startDate : existing?.startDate;
  const end = data.endDate !== undefined ? data.endDate : existing?.endDate;
  if (start && end && new Date(end) <= new Date(start)) return { error: 'End date must be after the start date.' };
  return { data };
};

const withState = (doc) => {
  const a = doc.toObject ? doc.toObject() : doc;
  return { ...a, state: announcementState(a) };
};

// Get all announcements
const getAllAnnouncements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      type = '',
      isActive = '',
      state = ''
    } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: searchRegex(search) },
        { content: searchRegex(search) }
      ];
    }
    if (type) filter.type = type;
    if (isActive !== '') filter.isActive = isActive === 'true';

    const now = new Date();
    if (state === 'draft') filter.isActive = false;
    if (state === 'scheduled') Object.assign(filter, { isActive: true, startDate: { $gt: now } });
    if (state === 'expired') Object.assign(filter, { isActive: true, endDate: { $lte: now } });
    if (state === 'live') {
      Object.assign(filter, { isActive: true, startDate: { $lte: now } });
      filter.$and = [{ $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gt: now } }] }];
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'firstName lastName')
        .sort({ isPinned: -1, startDate: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Announcement.countDocuments(filter),
    ]);

    res.json({
      announcements: announcements.map(withState),
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum
    });
  } catch (error) {
    logger.error('Get all announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
};

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const { data, error } = announcementInput(req.body || {});
    if (error) return res.status(400).json({ error });

    const announcement = await Announcement.create({ ...data, createdBy: req.user._id });
    await announcement.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: withState(announcement)
    });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    logger.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ error: 'Announcement not found.' });
    const existing = await Announcement.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    const { data, error } = announcementInput(req.body || {}, existing);
    if (error) return res.status(400).json({ error });

    existing.set(data);
    await existing.save();
    await existing.populate('createdBy', 'firstName lastName');

    res.json({
      message: 'Announcement updated successfully',
      announcement: withState(existing)
    });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    logger.error('Update announcement error:', error);
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
    logger.error('Delete announcement error:', error);
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
          totalViews: { $sum: { $ifNull: ['$analytics.views', 0] } }
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
    logger.error('Get enhanced analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced analytics.' });
  }
};

// ==================== NEW: REVENUE ANALYTICS ====================

// Get revenue analytics
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate.setDate(startDate.getDate() - 30);

    // The only paid product today is featuring a listing, so revenue is the
    // sum of featuredPrice for listings featured within the period.
    const featuredInPeriod = { isFeatured: true, featuredAt: { $gte: startDate }, featuredPrice: { $gt: 0 } };

    const [totals] = await Property.aggregate([
      { $match: featuredInPeriod },
      { $group: { _id: null, revenue: { $sum: '$featuredPrice' }, count: { $sum: 1 } } }
    ]);

    const monthly = await Property.aggregate([
      { $match: featuredInPeriod },
      {
        $group: {
          _id: { year: { $year: '$featuredAt' }, month: { $month: '$featuredAt' } },
          revenue: { $sum: '$featuredPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthName = (m) => new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'short' });
    const round = (n) => Math.round(n * 100) / 100;
    const featuredListingRevenue = round(totals?.revenue || 0);

    res.json({
      period,
      totalRevenue: featuredListingRevenue,
      featuredListingRevenue,
      featuredListingsSold: totals?.count || 0,
      commissionEarnings: 0,
      monthlyRevenue: monthly.map((m) => ({
        month: `${monthName(m._id.month)} ${m._id.year}`,
        revenue: round(m.revenue)
      }))
    });
  } catch (error) {
    logger.error('Get revenue analytics error:', error);
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
  assignListingAgent,
  getAssignableAgents,
  
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
