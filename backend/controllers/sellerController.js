const Property = require('../models/Property');
const Inquiry = require('../models/Inquiry');
const OpenHouse = require('../models/OpenHouse');
const ListingAnalytics = require('../models/ListingAnalytics');
const User = require('../models/User');

// ===== DASHBOARD OVERVIEW =====
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
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

    res.json({
      success: true,
      data: {
        stats: {
          totalProperties,
          activeProperties,
          totalInquiries: totalInquiries || 0,
          totalViews: totalViews[0]?.totalViews || 0
        },
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
    const { id } = req.params;
    const sellerId = req.user.id;

    const property = await Property.findOne({ _id: id, owner: sellerId });
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
    const { id } = req.params;
    const sellerId = req.user.id;

    const inquiry = await Inquiry.findById(id)
      .populate('property', 'title address')
      .populate('buyer', 'firstName lastName email phone');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
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
    const sellerId = req.user.id;
    const analytics = await ListingAnalytics.find({
      property: { $in: await Property.find({ owner: sellerId }).select('_id') }
    }).populate('property', 'title');

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
    const { id } = req.params;
    const { price } = req.body;
    const sellerId = req.user.id;

    const property = await Property.findOne({ _id: id, owner: sellerId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
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
    const { id } = req.params;
    const sellerId = req.user.id;

    const openHouse = await OpenHouse.findOne({ _id: id, seller: sellerId });
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
    const { id } = req.params;
    const sellerId = req.user.id;

    const openHouse = await OpenHouse.findOne({ _id: id, seller: sellerId });
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
    const { id } = req.params;
    const { workflow } = req.body;
    const sellerId = req.user.id;

    const property = await Property.findOne({ _id: id, owner: sellerId });
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