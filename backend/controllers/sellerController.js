
const { Property, Inquiry, OpenHouse, ListingAnalytics, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// ===== DASHBOARD OVERVIEW =====
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;
    console.log('Seller dashboard request for user ID:', sellerId);
    
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
    
    res.json({
      dashboard: {
        properties: propertiesWithWorkflow,
        stats: {
          totalProperties: properties.length,
          activeProperties: properties.filter(p => p.status === 'active').length,
          totalViews: analyticsSummary[0]?.totalViews || 0,
          totalInquiries: analyticsSummary[0]?.totalInquiries || 0,
          totalSaves: analyticsSummary[0]?.totalSaves || 0,
          avgResponseTime: analyticsSummary[0]?.avgResponseTime || 0,
          upcomingOpenHouses
        },
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
  }
};

// ===== PROPERTY LISTING WIZARD =====
const createPropertyListing = async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      ownerId: req.user.id,
      status: 'pending' // Start in pending status for review
    };
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const photos = req.files.map((file, index) => ({
        url: `/uploads/property-images/${file.filename}`,
        caption: file.originalname,
        isPrimary: index === 0,
        order: index + 1
      }));
      propertyData.photos = photos;
    }
    
    const property = await Property.create(propertyData);
    
    // Create analytics record
    const analytics = await ListingAnalytics.create({
      propertyId: property.id,
      sellerId: req.user.id
    });
    
    res.status(201).json({
      message: 'Property listing created successfully',
      property,
      workflowStage: 'List'
    });
  } catch (error) {
    console.error('Create property listing error:', error);
    res.status(500).json({ error: 'Failed to create property listing.' });
  }
};

const updatePropertyListing = async (req, res) => {
  try {
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found or not authorized.' });
    }
    
    const updateData = { ...req.body };
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const photos = req.files.map((file, index) => ({
        url: `/uploads/property-images/${file.filename}`,
        caption: file.originalname,
        isPrimary: index === 0,
        order: index + 1
      }));
      updateData.photos = photos;
    }
    
    await property.update(updateData);
    const updatedProperty = await Property.findByPk(req.params.id);
    
    res.json({
      message: 'Property listing updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Update property listing error:', error);
    res.status(500).json({ error: 'Failed to update property listing.' });
  }
};

// ===== PHOTO MANAGEMENT =====
const updatePropertyPhotos = async (req, res) => {
  try {
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found or not authorized.' });
    }
    
    const { photos } = req.body;
    
    // Validate photos array
    if (!Array.isArray(photos)) {
      return res.status(400).json({ error: 'Photos must be an array.' });
    }
    
    // Ensure at least one primary photo
    const hasPrimary = photos.some(photo => photo.isPrimary);
    if (!hasPrimary && photos.length > 0) {
      photos[0].isPrimary = true;
    }
    
    property.photos = photos;
    await property.save();
    
    res.json({
      message: 'Property photos updated successfully',
      photos: property.photos
    });
  } catch (error) {
    console.error('Update property photos error:', error);
    res.status(500).json({ error: 'Failed to update property photos.' });
  }
};

// ===== INQUIRY DASHBOARD =====
const getInquiries = async (req, res) => {
  try {
    const { status, priority, type, page = 1, limit = 10 } = req.query;
    
    const filter = { sellerId: req.user.id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    
    const inquiries = await Inquiry.findAll({
      where: filter,
      include: [
        { model: Property, as: 'property', attributes: ['title', 'address', 'price', 'photos'] },
        { model: User, as: 'buyer', attributes: ['firstName', 'lastName', 'email', 'phone', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    const total = await Inquiry.count({ where: filter });
    
    res.json({
      inquiries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    // Return empty data instead of error to prevent infinite loading
    res.json({
      inquiries: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      }
    });
  }
};

const getInquiryDetails = async (req, res) => {
  try {
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
      });
    }
    
    res.json({
      message: 'Response sent successfully',
      inquiry
    });
  } catch (error) {
    console.error('Respond to inquiry error:', error);
    res.status(500).json({ error: 'Failed to respond to inquiry.' });
  }
};

// ===== LISTING ANALYTICS =====
const getListingAnalytics = async (req, res) => {
  try {
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
    
    res.json({
      analytics,
      insights,
      recommendations: analytics.recommendations
    });
  } catch (error) {
    console.error('Get analytics details error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics details.' });
  }
};

// ===== PRICE CHANGE HISTORY =====
const updatePropertyPrice = async (req, res) => {
  try {
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
      });
    }
    
    res.json({
      message: 'Property price updated successfully',
      property,
      priceChange: {
        oldPrice,
        newPrice,
        change: newPrice - oldPrice,
        changePercent: ((newPrice - oldPrice) / oldPrice * 100).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Update property price error:', error);
    res.status(500).json({ error: 'Failed to update property price.' });
  }
};

const getPriceHistory = async (req, res) => {
  try {
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      },
      attributes: ['priceHistory', 'price']
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found or not authorized.' });
    }
    
    res.json({
      priceHistory: property.priceHistory,
      currentPrice: property.price
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ error: 'Failed to fetch price history.' });
  }
};

// ===== OPEN HOUSE SCHEDULING =====
const createOpenHouse = async (req, res) => {
  try {
    const openHouseData = {
      ...req.body,
      seller: req.user._id
    };
    
    const openHouse = new OpenHouse(openHouseData);
    await openHouse.save();
    
    res.status(201).json({
      message: 'Open house created successfully',
      openHouse
    });
  } catch (error) {
    console.error('Create open house error:', error);
    res.status(500).json({ error: 'Failed to create open house.' });
  }
};

const getOpenHouses = async (req, res) => {
  try {
    const { status = 'upcoming' } = req.query;
    
    let openHouses;
    const { Op } = require('sequelize');
    if (status === 'upcoming') {
      openHouses = await OpenHouse.findAll({
        where: {
          sellerId: req.user.id,
          startDate: { [Op.gte]: new Date() },
          status: { [Op.in]: ['scheduled', 'active'] }
        },
        order: [['startDate', 'ASC']]
      });
    } else {
      openHouses = await OpenHouse.findAll({
        where: {
          sellerId: req.user.id,
          startDate: { [Op.lt]: new Date() }
        },
        order: [['startDate', 'DESC']]
      });
    }
    
    res.json({ openHouses });
  } catch (error) {
    console.error('Get open houses error:', error);
    // Return empty data instead of error to prevent infinite loading
    res.json({ openHouses: [] });
  }
};

const updateOpenHouse = async (req, res) => {
  try {
    const openHouse = await OpenHouse.findOne({
      where: {
        id: req.params.id,
        sellerId: req.user.id
      }
    });
    
    if (!openHouse) {
      return res.status(404).json({ error: 'Open house not found or not authorized.' });
    }
    
    await openHouse.update(req.body);
    const updatedOpenHouse = await OpenHouse.findByPk(req.params.id);
    
    res.json({
      message: 'Open house updated successfully',
      openHouse: updatedOpenHouse
    });
  } catch (error) {
    console.error('Update open house error:', error);
    res.status(500).json({ error: 'Failed to update open house.' });
  }
};

const cancelOpenHouse = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const openHouse = await OpenHouse.findOne({
      where: {
        id: req.params.id,
        sellerId: req.user.id
      }
    });
    
    if (!openHouse) {
      return res.status(404).json({ error: 'Open house not found or not authorized.' });
    }
    
    await openHouse.update({ 
      status: 'cancelled', 
      cancellation_reason: reason,
      cancelled_at: new Date()
    });
    
    res.json({
      message: 'Open house cancelled successfully',
      openHouse
    });
  } catch (error) {
    console.error('Cancel open house error:', error);
    res.status(500).json({ error: 'Failed to cancel open house.' });
  }
};

// ===== WORKFLOW MANAGEMENT =====
const updatePropertyWorkflow = async (req, res) => {
  try {
    const { stage, notes } = req.body;
    
    const property = await Property.findOne({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found or not authorized.' });
    }
    
    // Update status based on workflow stage
    let newStatus = property.status;
    switch (stage) {
      case 'List':
        newStatus = 'pending';
        break;
      case 'Market':
        newStatus = 'active';
        break;
      case 'Show':
        newStatus = 'active';
        break;
      case 'Negotiate':
        newStatus = 'under-contract';
        break;
      case 'Close':
        newStatus = 'sold';
        break;
    }
    
    property.status = newStatus;
    await property.save();
    
    res.json({
      message: 'Property workflow updated successfully',
      property,
      workflowStage: stage
    });
  } catch (error) {
    console.error('Update property workflow error:', error);
    res.status(500).json({ error: 'Failed to update property workflow.' });
  }
};

module.exports = {
  getSellerDashboard,
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
