const User = require('../models/User');
const Property = require('../models/Property');
const Report = require('../models/Report');

// ==================== USER MANAGEMENT ====================

// Get all users with filters and pagination
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, status } = req.query;
    
    // Build filter object
    const filter = {};
    if (role) filter.userType = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'blocked') filter.isBlocked = true;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role, status, or other admin fields
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userType, isActive, isBlocked, isVerified } = req.body;

    // Validate userType if provided
    if (userType && !['buyer', 'seller', 'renter', 'agent', 'admin'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { 
        $set: { 
          userType, 
          isActive, 
          isBlocked, 
          isVerified 
        } 
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ==================== LISTING MANAGEMENT ====================

// Get all listings with filters and pagination
const getAllListings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, propertyType } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (propertyType) filter.propertyType = propertyType;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const listings = await Property.find(filter)
      .populate('owner', 'firstName lastName email userType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Property.countDocuments(filter);

    res.json({
      listings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

// Update listing status (approve/reject)
const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Validate status
    if (!['pending', 'approved', 'rejected', 'sold', 'rented'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const listing = await Property.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status, 
          adminNotes,
          adminApprovedAt: new Date(),
          adminApprovedBy: req.user._id
        } 
      },
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email userType');

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ message: 'Listing status updated successfully', listing });
  } catch (error) {
    console.error('Update listing status error:', error);
    res.status(500).json({ error: 'Failed to update listing status' });
  }
};

// Delete listing
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Property.findByIdAndDelete(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
};

// ==================== REPORTS & MODERATION ====================

// Get all reports with filters
const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const reports = await Report.find(filter)
      .populate('reportedBy', 'firstName lastName email')
      .populate('reportedItem')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Resolve report
const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, action } = req.body;

    // Validate status
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status, 
          adminNotes,
          resolvedAt: new Date(),
          resolvedBy: req.user._id,
          action
        } 
      },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'firstName lastName email')
     .populate('reportedItem');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report resolved successfully', report });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
};

// ==================== ANALYTICS & DASHBOARD ====================

// Get admin dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    // User analytics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$userType', count: { $sum: 1 } } }
    ]);

    // Listing analytics
    const totalListings = await Property.countDocuments();
    const pendingListings = await Property.countDocuments({ status: 'pending' });
    const approvedListings = await Property.countDocuments({ status: 'approved' });
    const soldListings = await Property.countDocuments({ status: 'sold' });
    const rentedListings = await Property.countDocuments({ status: 'rented' });

    // Report analytics
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });

    // Recent activity
    const recentUsers = await User.find()
      .select('firstName lastName userType createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentListings = await Property.find()
      .select('title status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReports = await Report.find()
      .select('type status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
        byRole: usersByRole,
        recent: recentUsers
      },
      listings: {
        total: totalListings,
        pending: pendingListings,
        approved: approvedListings,
        sold: soldListings,
        rented: rentedListings,
        recent: recentListings
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        resolved: resolvedReports,
        recent: recentReports
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
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
  
  // Analytics & Dashboard
  getDashboardAnalytics
};
