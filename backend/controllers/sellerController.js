const Property = require('../models/Property');
const Inquiry = require('../models/Inquiry');
const OpenHouse = require('../models/OpenHouse');
const ListingAnalytics = require('../models/ListingAnalytics');
const User = require('../models/User');
const Favorite = require('../models/Favorite');
const Message = require('../models/Message');
const logger = require('../utils/logger');

// ===== DASHBOARD OVERVIEW =====
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    // Get seller's properties with basic stats
    const properties = await Property.find({ owner: sellerId })
      .select('title address price currency listingType status photos analytics createdAt')
      .sort({ createdAt: -1 });
    
    // Get inquiry stats
    const inquiryStats = await Inquiry.aggregate([
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get open house stats
    const upcomingOpenHouses = await OpenHouse.countDocuments({
      seller: sellerId,
      startDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'active'] }
    });
    
    // Get analytics summary
    const analyticsSummary = await ListingAnalytics.aggregate([
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views.total' },
          totalInquiries: { $sum: '$inquiries.total' },
          totalSaves: { $sum: '$saves.total' },
          avgResponseTime: { $avg: '$responseTime.average' }
        }
      }
    ]);
    
    // Get recent activity
    const recentInquiries = await Inquiry.find({ seller: sellerId })
      .populate('property', 'title address price')
      .populate('buyer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);
    
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
        ...property.toObject(),
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
        inquiryStats: inquiryStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        recentActivity: recentInquiries
      }
    });
  } catch (error) {
    logger.error('Get seller dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch seller dashboard.' });
  }
};

// ===== PROPERTY LISTING WIZARD =====
const createPropertyListing = async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      owner: req.user._id,
      status: 'pending' // Start in pending status for review
    };
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const photos = req.files.map((file, index) => ({
        url: file.url,
        caption: file.originalname,
        isPrimary: index === 0,
        order: index + 1
      }));
      propertyData.photos = photos;
    }
    
    const property = new Property(propertyData);
    await property.save();
    
    // Create analytics record
    const analytics = new ListingAnalytics({
      property: property._id,
      seller: req.user._id
    });
    await analytics.save();
    
    res.status(201).json({
      message: 'Property listing created successfully',
      property,
      workflowStage: 'List'
    });
  } catch (error) {
    logger.error('Create property listing error:', error);
    res.status(500).json({ error: 'Failed to create property listing.' });
  }
};

const updatePropertyListing = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found or not authorized.' });
    }
    
    const updateData = { ...req.body };
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const photos = req.files.map((file, index) => ({
        url: file.url,
        caption: file.originalname,
        isPrimary: index === 0,
        order: index + 1
      }));
      updateData.photos = photos;
    }
    
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Property listing updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    logger.error('Update property listing error:', error);
    res.status(500).json({ error: 'Failed to update property listing.' });
  }
};

// ===== PHOTO MANAGEMENT =====
const updatePropertyPhotos = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id
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
    logger.error('Update property photos error:', error);
    res.status(500).json({ error: 'Failed to update property photos.' });
  }
};

// ===== INQUIRY DASHBOARD =====
const getInquiries = async (req, res) => {
  try {
    const { status, priority, type, page = 1, limit = 10 } = req.query;
    
    const filter = { seller: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    
    const inquiries = await Inquiry.find(filter)
      .populate('property', 'title address price photos')
      .populate('buyer', 'firstName lastName email phone avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Inquiry.countDocuments(filter);
    
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
    logger.error('Get inquiries error:', error);
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
      _id: req.params.id,
      seller: req.user._id
    })
    .populate('property', 'title address price photos description')
    .populate('buyer', 'firstName lastName email phone avatar');
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found or not authorized.' });
    }
    
    res.json({ inquiry });
  } catch (error) {
    logger.error('Get inquiry details error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiry details.' });
  }
};

const respondToInquiry = async (req, res) => {
  try {
    const { message, scheduleViewing, offerResponse } = req.body;
    
    const inquiry = await Inquiry.findOne({
      _id: req.params.id,
      seller: req.user._id
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
      property: inquiry.property,
      seller: req.user._id
    });
    
    if (analytics) {
      await analytics.recordInquiry(inquiry.type);
    }
    
    res.json({
      message: 'Response sent successfully',
      inquiry
    });
  } catch (error) {
    logger.error('Respond to inquiry error:', error);
    res.status(500).json({ error: 'Failed to respond to inquiry.' });
  }
};

// ===== LISTING ANALYTICS =====
// Per-listing performance built from real data:
// views are counted on each property page visit (owner visits excluded),
// saves come from favorites, inquiries are unique people who messaged.
const getListingAnalytics = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id })
      .select('title status price photos address analytics createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const ids = properties.map((p) => p._id);

    const [saves, inquiries] = await Promise.all([
      Favorite.aggregate([
        { $match: { property: { $in: ids } } },
        { $group: { _id: '$property', count: { $sum: 1 } } }
      ]),
      Message.aggregate([
        { $match: { property: { $in: ids } } },
        { $project: { property: 1, person: { $ifNull: ['$buyer', '$renter'] } } },
        { $match: { person: { $ne: null } } },
        { $group: { _id: '$property', people: { $addToSet: '$person' } } },
        { $project: { count: { $size: '$people' } } }
      ])
    ]);

    const countFor = (rows, id) => rows.find((r) => String(r._id) === String(id))?.count || 0;
    const rate = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

    const listings = properties.map((p) => {
      const views = p.analytics?.views || 0;
      const inquiryCount = countFor(inquiries, p._id);
      return {
        _id: p._id,
        title: p.title,
        status: p.status,
        price: p.price,
        city: p.address?.city,
        photo: p.photos?.[0]?.url || null,
        views,
        saves: countFor(saves, p._id),
        inquiries: inquiryCount,
        conversionRate: rate(inquiryCount, views),
        lastViewed: p.analytics?.lastViewed || null
      };
    });

    const summary = listings.reduce(
      (acc, l) => ({
        listings: acc.listings + 1,
        views: acc.views + l.views,
        saves: acc.saves + l.saves,
        inquiries: acc.inquiries + l.inquiries
      }),
      { listings: 0, views: 0, saves: 0, inquiries: 0 }
    );
    summary.conversionRate = rate(summary.inquiries, summary.views);

    res.json({ summary, listings });
  } catch (error) {
    logger.error('Get listing analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
};

const getAnalyticsDetails = async (req, res) => {
  try {
    const analytics = await ListingAnalytics.findOne({
      _id: req.params.id,
      seller: req.user._id
    })
    .populate('property', 'title address price photos');
    
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
    logger.error('Get analytics details error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics details.' });
  }
};

// ===== PRICE CHANGE HISTORY =====
const updatePropertyPrice = async (req, res) => {
  try {
    const { newPrice, reason } = req.body;
    
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id
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
      property: property._id,
      seller: req.user._id
    });
    
    if (analytics) {
      await analytics.recordPriceChange(
        oldPrice,
        newPrice,
        analytics.views.total,
        analytics.inquiries.total
      );
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
    logger.error('Update property price error:', error);
    res.status(500).json({ error: 'Failed to update property price.' });
  }
};

const getPriceHistory = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id
    }).select('priceHistory price');
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found or not authorized.' });
    }
    
    res.json({
      priceHistory: property.priceHistory,
      currentPrice: property.price
    });
  } catch (error) {
    logger.error('Get price history error:', error);
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
    logger.error('Create open house error:', error);
    res.status(500).json({ error: 'Failed to create open house.' });
  }
};

const getOpenHouses = async (req, res) => {
  try {
    const { status = 'upcoming' } = req.query;
    
    let openHouses;
    if (status === 'upcoming') {
      openHouses = await OpenHouse.getUpcomingBySeller(req.user._id);
    } else {
      openHouses = await OpenHouse.getPastBySeller(req.user._id);
    }
    
    res.json({ openHouses });
  } catch (error) {
    logger.error('Get open houses error:', error);
    // Return empty data instead of error to prevent infinite loading
    res.json({ openHouses: [] });
  }
};

const updateOpenHouse = async (req, res) => {
  try {
    const openHouse = await OpenHouse.findOne({
      _id: req.params.id,
      seller: req.user._id
    });
    
    if (!openHouse) {
      return res.status(404).json({ error: 'Open house not found or not authorized.' });
    }
    
    const updatedOpenHouse = await OpenHouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Open house updated successfully',
      openHouse: updatedOpenHouse
    });
  } catch (error) {
    logger.error('Update open house error:', error);
    res.status(500).json({ error: 'Failed to update open house.' });
  }
};

const cancelOpenHouse = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const openHouse = await OpenHouse.findOne({
      _id: req.params.id,
      seller: req.user._id
    });
    
    if (!openHouse) {
      return res.status(404).json({ error: 'Open house not found or not authorized.' });
    }
    
    await openHouse.cancel(reason);
    
    res.json({
      message: 'Open house cancelled successfully',
      openHouse
    });
  } catch (error) {
    logger.error('Cancel open house error:', error);
    res.status(500).json({ error: 'Failed to cancel open house.' });
  }
};

// ===== WORKFLOW MANAGEMENT =====
const updatePropertyWorkflow = async (req, res) => {
  try {
    const { stage, notes } = req.body;
    
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id
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
    logger.error('Update property workflow error:', error);
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
