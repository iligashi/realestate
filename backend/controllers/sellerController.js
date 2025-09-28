<<<<<<< Updated upstream
const Property = require('../models/Property');
const Inquiry = require('../models/Inquiry');
const OpenHouse = require('../models/OpenHouse');
const ListingAnalytics = require('../models/ListingAnalytics');
const User = require('../models/User');
=======
const { Property, Inquiry, OpenHouse, ListingAnalytics, User, sequelize } = require('../models');
const { Op } = require('sequelize');
>>>>>>> Stashed changes

// ===== DASHBOARD OVERVIEW =====
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;
    console.log('Seller dashboard request for user ID:', sellerId);
    
<<<<<<< Updated upstream
    // Get basic stats
    const totalProperties = await Property.countDocuments({ owner: sellerId });
    const activeProperties = await Property.countDocuments({ 
      owner: sellerId, 
      status: 'active' 
    });
    const totalInquiries = await Inquiry.countDocuments({ 
      property: { $in: await Property.find({ owner: sellerId }).select('_id') }
    });
    const totalViews = await Property.aggregate([
      { $match: { owner: sellerId } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    // Get recent properties
    const recentProperties = await Property.find({ owner: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('owner', 'firstName lastName email')
      .lean();

    // Get recent inquiries
    const recentInquiries = await Inquiry.find({
      property: { $in: await Property.find({ owner: sellerId }).select('_id') }
    })
      .populate('property', 'title address')
      .populate('buyer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

=======
    // Get seller's properties with basic stats
    console.log('Fetching properties for seller...');
    const properties = await Property.findAll({
      where: { ownerId: sellerId },
      attributes: ['id', 'title', 'address', 'price', 'status', 'photos', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    console.log('Found properties:', properties.length);
    
    // Get inquiry stats
    const inquiryStats = await Inquiry.findAll({
      where: { sellerId: sellerId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // Get open house stats
    const upcomingOpenHouses = await OpenHouse.count({
      where: {
        sellerId: sellerId,
        startDate: { [Op.gte]: new Date() },
        status: { [Op.in]: ['scheduled', 'active'] }
      }
    });
    
    // Get analytics summary - since these are JSON fields, we need to get all records and calculate manually
    const analyticsRecords = await ListingAnalytics.findAll({
      where: { sellerId: sellerId },
      raw: true
    });
    
    // Calculate totals from JSON fields
    let totalViews = 0;
    let totalInquiries = 0;
    let totalSaves = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    analyticsRecords.forEach(record => {
      // Parse JSON fields if they are strings
      let views = record.views;
      let inquiries = record.inquiries;
      let saves = record.saves;
      let responseTime = record.response_time;
      
      if (typeof views === 'string') {
        try { views = JSON.parse(views); } catch (e) { views = null; }
      }
      if (typeof inquiries === 'string') {
        try { inquiries = JSON.parse(inquiries); } catch (e) { inquiries = null; }
      }
      if (typeof saves === 'string') {
        try { saves = JSON.parse(saves); } catch (e) { saves = null; }
      }
      if (typeof responseTime === 'string') {
        try { responseTime = JSON.parse(responseTime); } catch (e) { responseTime = null; }
      }
      
      if (views && typeof views === 'object') {
        totalViews += views.total || 0;
      }
      if (inquiries && typeof inquiries === 'object') {
        totalInquiries += inquiries.total || 0;
      }
      if (saves && typeof saves === 'object') {
        totalSaves += saves.total || 0;
      }
      if (responseTime && typeof responseTime === 'object' && responseTime.average) {
        totalResponseTime += responseTime.average;
        responseTimeCount++;
      }
    });
    
    const avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    
    const analyticsSummary = [{
      totalViews,
      totalInquiries,
      totalSaves,
      avgResponseTime
    }];
    
    // Get recent activity - simplified for now
    const recentInquiries = [];
    
    // Calculate workflow status for each property
    const propertiesWithWorkflow = properties.map(property => {
      let workflowStage = 'List';
      if (property.status === 'active') {
        workflowStage = 'Market';
      } else if (property.status === 'under-contract') {
        workflowStage = 'Negotiate';
      } else if (property.status === 'sold') {
        workflowStage = 'Close';
      }
      
      return {
        ...property.toJSON(),
        workflowStage,
        daysOnMarket: Math.floor((new Date() - property.createdAt) / (1000 * 60 * 60 * 24))
      };
    });
    
>>>>>>> Stashed changes
    res.json({
      success: true,
      data: {
        stats: {
          totalProperties,
          activeProperties,
          totalInquiries: totalInquiries || 0,
          totalViews: totalViews[0]?.totalViews || 0
        },
<<<<<<< Updated upstream
        recentProperties,
        recentInquiries
      }
    });
  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
=======
        inquiryStats: inquiryStats.length > 0 ? inquiryStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {}) : {},
        recentActivity: recentInquiries
      }
    });
  } catch (error) {
    console.error('Get seller dashboard error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to fetch seller dashboard.' });
>>>>>>> Stashed changes
  }
};

// ===== PROPERTY MANAGEMENT =====
const getSellerProperties = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, status, propertyType, listingType } = req.query;
    
    const query = { owner: sellerId };
    
    if (status) query.status = status;
    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;

    const properties = await Property.find(query)
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Property.countDocuments(query);

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching seller properties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching properties',
      error: error.message
    });
  }
};

const createProperty = async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      owner: req.user.id
    };

    const property = new Property(propertyData);
    await property.save();

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating property',
      error: error.message
    });
  }
};

const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const property = await Property.findOne({ _id: id, owner: sellerId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating property',
      error: error.message
    });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const property = await Property.findOne({ _id: id, owner: sellerId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    await Property.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting property',
      error: error.message
    });
  }
};

// ===== INQUIRY MANAGEMENT =====
const getSellerInquiries = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const sellerProperties = await Property.find({ owner: sellerId }).select('_id');
    const propertyIds = sellerProperties.map(p => p._id);

    const query = { property: { $in: propertyIds } };
    if (status) query.status = status;

    const inquiries = await Inquiry.find(query)
      .populate('property', 'title address')
      .populate('buyer', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Inquiry.countDocuments(query);

    res.json({
      success: true,
      data: {
        inquiries,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching seller inquiries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inquiries',
      error: error.message
    });
  }
};

const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sellerId = req.user.id;

    const inquiry = await Inquiry.findById(id)
      .populate('property', 'owner');
    
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    if (inquiry.property.owner.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    inquiry.status = status;
    await inquiry.save();

    res.json({
      success: true,
      message: 'Inquiry status updated successfully',
      data: inquiry
    });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inquiry status',
      error: error.message
    });
  }
};

// ===== ANALYTICS =====
const getPropertyAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const property = await Property.findOne({ _id: id, owner: sellerId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Get analytics data
    const analytics = await ListingAnalytics.findOne({ property: id });
    
    res.json({
      success: true,
      data: {
        property: {
          id: property._id,
          title: property.title,
          views: property.views
        },
        analytics: analytics || {
          views: 0,
          inquiries: 0,
          favorites: 0,
          lastViewed: null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching property analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// Additional functions for route compatibility
const createPropertyListing = createProperty;
const updatePropertyListing = updateProperty;
const updatePropertyPhotos = async (req, res) => {
  try {
<<<<<<< Updated upstream
    const { id } = req.params;
    const sellerId = req.user.id;

    const property = await Property.findOne({ _id: id, owner: sellerId });
=======
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });
    
>>>>>>> Stashed changes
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Handle photo updates here
    res.json({
      success: true,
      message: 'Property photos updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating photos',
      error: error.message
    });
  }
};

const getInquiries = getSellerInquiries;
const getInquiryDetails = async (req, res) => {
  try {
<<<<<<< Updated upstream
    const { id } = req.params;
    const sellerId = req.user.id;

    const inquiry = await Inquiry.findById(id)
      .populate('property', 'title address')
      .populate('buyer', 'firstName lastName email phone');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
=======
    const inquiry = await Inquiry.findOne({
      where: {
        id: req.params.id,
        sellerId: req.user.id
      },
      include: [
        { model: Property, as: 'property', attributes: ['title', 'address', 'price', 'photos', 'description'] },
        { model: User, as: 'buyer', attributes: ['firstName', 'lastName', 'email', 'phone', 'avatar'] }
      ]
    });
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found or not authorized.' });
    }
    
    res.json({ inquiry });
  } catch (error) {
    console.error('Get inquiry details error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiry details.' });
  }
};

const respondToInquiry = async (req, res) => {
  try {
    const { message, scheduleViewing, offerResponse } = req.body;
    
    const inquiry = await Inquiry.findOne({
      where: {
        id: req.params.id,
        sellerId: req.user.id
      }
    });
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found or not authorized.' });
    }
    
    // Update inquiry status
    inquiry.status = 'responded';
    inquiry.responseCount += 1;
    inquiry.lastResponse = new Date();
    
    // Handle scheduling viewing
    if (scheduleViewing) {
      inquiry.scheduledViewing = {
        date: scheduleViewing.date,
        time: scheduleViewing.time,
        duration: scheduleViewing.duration || 60,
        notes: scheduleViewing.notes,
        confirmed: false
      };
      inquiry.status = 'scheduled';
    }
    
    // Handle offer response
    if (offerResponse && inquiry.offer) {
      inquiry.offer.status = offerResponse.status;
      if (offerResponse.counterOffer) {
        inquiry.offer.amount = offerResponse.counterOffer.amount;
        inquiry.offer.conditions = offerResponse.counterOffer.conditions;
      }
    }
    
    await inquiry.save();
    
    // Update analytics
    const analytics = await ListingAnalytics.findOne({
      where: {
        propertyId: inquiry.propertyId,
        sellerId: req.user.id
      }
    });
    
    if (analytics) {
      await analytics.update({
        inquiries: analytics.inquiries + 1
>>>>>>> Stashed changes
      });
    }

    res.json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inquiry details',
      error: error.message
    });
  }
};

const respondToInquiry = updateInquiryStatus;
const getListingAnalytics = async (req, res) => {
  try {
<<<<<<< Updated upstream
    const sellerId = req.user.id;
    const analytics = await ListingAnalytics.find({
      property: { $in: await Property.find({ owner: sellerId }).select('_id') }
    }).populate('property', 'title');

=======
    const { propertyId, period = '30d' } = req.query;
    
    let filter = { sellerId: req.user.id };
    if (propertyId) filter.propertyId = propertyId;
    
    const analytics = await ListingAnalytics.findAll({
      where: filter,
      include: [
        { model: Property, as: 'property', attributes: ['title', 'address', 'price', 'status'] }
      ],
      order: [['views_last_updated', 'DESC']]
    });
    
    // Calculate period-based data
    const periodData = analytics.map(analytic => {
      const data = analytic.toJSON();
      
      // Filter data based on period
      if (period === '7d') {
        data.views.period = data.views.thisWeek;
        data.inquiries.period = data.inquiries.thisWeek;
        data.saves.period = data.saves.thisWeek;
      } else if (period === '30d') {
        data.views.period = data.views.thisMonth;
        data.inquiries.period = data.inquiries.thisMonth;
        data.saves.period = data.saves.thisMonth;
      } else {
        data.views.period = data.views.total;
        data.inquiries.period = data.inquiries.total;
        data.saves.period = data.saves.total;
      }
      
      return data;
    });
    
    res.json({ analytics: periodData });
  } catch (error) {
    console.error('Get listing analytics error:', error);
    // Return empty data instead of error to prevent infinite loading
    res.json({ analytics: [] });
  }
};

const getAnalyticsDetails = async (req, res) => {
  try {
    const analytics = await ListingAnalytics.findOne({
      where: {
        id: req.params.id,
        sellerId: req.user.id
      },
      include: [
        { model: Property, as: 'property', attributes: ['title', 'address', 'price', 'photos'] }
      ]
    });
    
    if (!analytics) {
      return res.status(404).json({ error: 'Analytics not found or not authorized.' });
    }
    
    // Calculate performance insights
    const insights = {
      topTrafficSource: Object.keys(analytics.trafficSources).reduce((a, b) => 
        analytics.trafficSources[a] > analytics.trafficSources[b] ? a : b
      ),
      bestPerformingHour: analytics.hourlyViews.reduce((a, b) => 
        a.views > b.views ? a : b
      ),
      conversionRate: analytics.views.total > 0 ? 
        (analytics.inquiries.total / analytics.views.total * 100).toFixed(2) : 0,
      responseQuality: analytics.responseTime.average < 24 ? 'Excellent' : 
        analytics.responseTime.average < 48 ? 'Good' : 'Needs Improvement'
    };
    
>>>>>>> Stashed changes
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

const getAnalyticsDetails = getPropertyAnalytics;
const updatePropertyPrice = async (req, res) => {
  try {
<<<<<<< Updated upstream
    const { id } = req.params;
    const { price } = req.body;
    const sellerId = req.user.id;

    const property = await Property.findOne({ _id: id, owner: sellerId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
=======
    const { newPrice, reason } = req.body;
    
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found or not authorized.' });
    }
    
    const oldPrice = property.price;
    
    // Add to price history
    property.priceHistory.push({
      price: oldPrice,
      date: new Date(),
      reason: reason || 'Price update'
    });
    
    // Update current price
    property.price = newPrice;
    await property.save();
    
    // Update analytics
    const analytics = await ListingAnalytics.findOne({
      where: {
        propertyId: property.id,
        sellerId: req.user.id
      }
    });
    
    if (analytics) {
      await analytics.update({
        price_changes: analytics.price_changes + 1,
        last_price_change: new Date()
>>>>>>> Stashed changes
      });
    }

    property.price = price;
    await property.save();

    res.json({
      success: true,
      message: 'Property price updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating price',
      error: error.message
    });
  }
};

const getPriceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: property.priceHistory || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching price history',
      error: error.message
    });
  }
};

const createOpenHouse = async (req, res) => {
  try {
    const openHouseData = {
      ...req.body,
      seller: req.user.id
    };

    const openHouse = new OpenHouse(openHouseData);
    await openHouse.save();

    res.status(201).json({
      success: true,
      message: 'Open house created successfully',
      data: openHouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating open house',
      error: error.message
    });
  }
};

const getOpenHouses = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const openHouses = await OpenHouse.find({ seller: sellerId })
      .populate('property', 'title address')
      .sort({ date: 1 });

    res.json({
      success: true,
      data: openHouses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching open houses',
      error: error.message
    });
  }
};

const updateOpenHouse = async (req, res) => {
  try {
<<<<<<< Updated upstream
    const { id } = req.params;
    const sellerId = req.user.id;

    const openHouse = await OpenHouse.findOne({ _id: id, seller: sellerId });
=======
    const openHouse = await OpenHouse.findOne({
      where: {
        id: req.params.id,
        sellerId: req.user.id
      }
    });
    
>>>>>>> Stashed changes
    if (!openHouse) {
      return res.status(404).json({
        success: false,
        message: 'Open house not found'
      });
    }

    const updatedOpenHouse = await OpenHouse.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Open house updated successfully',
      data: updatedOpenHouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating open house',
      error: error.message
    });
  }
};

const cancelOpenHouse = async (req, res) => {
  try {
<<<<<<< Updated upstream
    const { id } = req.params;
    const sellerId = req.user.id;

    const openHouse = await OpenHouse.findOne({ _id: id, seller: sellerId });
=======
    const { reason } = req.body;
    
    const openHouse = await OpenHouse.findOne({
      where: {
        id: req.params.id,
        sellerId: req.user.id
      }
    });
    
>>>>>>> Stashed changes
    if (!openHouse) {
      return res.status(404).json({
        success: false,
        message: 'Open house not found'
      });
    }

    await OpenHouse.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Open house cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling open house',
      error: error.message
    });
  }
};

const updatePropertyWorkflow = async (req, res) => {
  try {
<<<<<<< Updated upstream
    const { id } = req.params;
    const { workflow } = req.body;
    const sellerId = req.user.id;

    const property = await Property.findOne({ _id: id, owner: sellerId });
=======
    const { stage, notes } = req.body;
    
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });
    
>>>>>>> Stashed changes
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    property.workflow = workflow;
    await property.save();

    res.json({
      success: true,
      message: 'Property workflow updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating workflow',
      error: error.message
    });
  }
};

module.exports = {
  getSellerDashboard,
  getSellerProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getSellerInquiries,
  updateInquiryStatus,
  getPropertyAnalytics,
  createPropertyListing,
  updatePropertyListing,
  updatePropertyPhotos,
  getInquiries,
  getInquiryDetails,
  respondToInquiry,
  getListingAnalytics,
  getAnalyticsDetails,
  updatePropertyPrice,
  getPriceHistory,
  createOpenHouse,
  getOpenHouses,
  updateOpenHouse,
  cancelOpenHouse,
  updatePropertyWorkflow
};