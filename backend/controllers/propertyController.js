const Property = require('../models/Property');
const { searchRegex } = require('../utils/searchRegex');

// Listings anyone can see. 'pending' (awaiting review) and 'inactive' are
// only visible to their owner and admins.
const PUBLIC_STATUSES = ['active', 'under-contract', 'sold', 'rented'];

// Statuses an owner may switch between once a listing has been approved.
// 'pending' (awaiting review) and approval itself are admin-only.
const OWNER_STATUSES = ['active', 'inactive', 'under-contract', 'sold', 'rented'];
const ALL_STATUSES = ['pending', ...OWNER_STATUSES];

const isAdmin = (user) => user?.userType === 'admin';

const canSeeUnlisted = (user, property) =>
  Boolean(user) && (user.userType === 'admin' || String(property.owner?._id || property.owner) === String(user._id));
const logger = require('../utils/logger');

// Get all properties (with optional filtering)
const getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      propertyType,
      listingType,
      minPrice,
      maxPrice,
      city,
      state,
      country,
      bedrooms,
      bathrooms
    } = req.query;

    // Build filter object: public listings only
    const filter = { status: { $in: PUBLIC_STATUSES } };
    
    if (propertyType) filter.propertyType = propertyType;
    if (listingType) filter.listingType = listingType;
    if (city) filter['address.city'] = searchRegex(city);
    if (state) filter['address.state'] = searchRegex(state);
    if (country) filter['address.country'] = searchRegex(country);
    if (bedrooms) filter['details.bedrooms'] = { $gte: parseInt(bedrooms) };
    if (bathrooms) filter['details.bathrooms'] = { $gte: parseInt(bathrooms) };
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Only show active, sold, and rented properties
    filter.status = { $in: ['active', 'sold', 'rented'] };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const properties = await Property.find(filter)
      .populate('owner', 'firstName lastName email phone avatar')
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Property.countDocuments(filter);

    res.json({
      properties,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalItems: total,
        itemsPerPage: options.limit
      }
    });
  } catch (error) {
    logger.error('Get properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties.' });
  }
};

// Get single property by ID
const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'firstName lastName email phone avatar')
      .populate('agent', 'firstName lastName email phone avatar agent');

    if (!property || (!PUBLIC_STATUSES.includes(property.status) && !canSeeUnlisted(req.user, property))) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Count a view, but not the owner looking at their own listing
    if (String(property.owner?._id) !== String(req.user?._id)) {
      await Property.updateOne(
        { _id: property._id },
        { $inc: { 'analytics.views': 1 }, $set: { 'analytics.lastViewed': new Date() } }
      );
    }

    res.json({ property });
  } catch (error) {
    logger.error('Get property error:', error);
    res.status(500).json({ error: 'Failed to fetch property.' });
  }
};

// Create new property (requires authentication)
const createProperty = async (req, res) => {
  try {
    logger.debug('=== createProperty controller ===');
    logger.debug('Request body:', req.body);
    logger.debug('Request files:', req.files);
    
    // Defensive check - ensure req.body exists
    if (!req.body) {
      logger.error('No request body received');
      return res.status(400).json({ error: 'No request body received' });
    }
    
    // Create a clean property data object with safe defaults
    const propertyData = {
      title: req.body.title || 'Untitled Property',
      description: req.body.description || 'No description provided',
      propertyType: req.body.propertyType || 'apartment',
      listingType: req.body.listingType || 'sale',
      price: parseFloat(req.body.price) || 0,
      currency: req.body.currency || 'USD',
      // New listings wait for admin review unless an admin creates them
      status: isAdmin(req.user) && ALL_STATUSES.includes(req.body.status) ? req.body.status : isAdmin(req.user) ? 'active' : 'pending',
      owner: req.user._id,
      address: {
        street: req.body.address?.street || '',
        city: req.body.address?.city || 'Unknown City',
        state: req.body.address?.state || '',
        zipCode: req.body.address?.zipCode || '',
        country: req.body.address?.country || 'US'
      },
      location: {
        type: 'Point',
        coordinates: [0, 0] // Default coordinates
      },
      details: {
        bedrooms: parseInt(req.body.details?.bedrooms) || 0,
        bathrooms: parseFloat(req.body.details?.bathrooms) || 0,
        squareMeters: parseInt(req.body.details?.squareMeters) || 0,
        yearBuilt: parseInt(req.body.details?.yearBuilt) || undefined
      },
      features: {
        parkingAvailable: req.body.features?.parkingAvailable === 'true',
        furnished: req.body.features?.furnished === 'true',
        petFriendly: req.body.features?.petFriendly === 'true',
        // Featuring is a paid product, set by admins only
        featured: isAdmin(req.user) && req.body.features?.featured === 'true'
      },
      amenities: Array.isArray(req.body.amenities) ? req.body.amenities : []
    };

    // Handle rental details if it's a rental property
    if (req.body.listingType === 'rental' && req.body.rentalDetails) {
      propertyData.rentalDetails = {
        monthlyRent: parseFloat(req.body.rentalDetails.monthlyRent) || 0,
        availableFrom: req.body.rentalDetails.availableFrom ? new Date(req.body.rentalDetails.availableFrom) : null,
        availableUntil: req.body.rentalDetails.availableUntil ? new Date(req.body.rentalDetails.availableUntil) : null,
        minimumLeaseMonths: parseInt(req.body.rentalDetails.minimumLeaseMonths) || 1,
        maximumLeaseMonths: req.body.rentalDetails.maximumLeaseMonths ? parseInt(req.body.rentalDetails.maximumLeaseMonths) : null,
        depositRequired: parseFloat(req.body.rentalDetails.depositRequired) || 0,
        utilitiesIncluded: req.body.rentalDetails.utilitiesIncluded === 'true',
        furnished: req.body.rentalDetails.furnished === 'true'
      };
    }

    // Handle uploaded images
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      logger.debug('Processing uploaded files:', req.files.length);
      
      const photos = req.files.map((file, index) => {
        logger.debug(`Processing file ${index + 1}:`, file.originalname);
        return {
          url: file.url,
          caption: file.originalname,
          isPrimary: index === 0, // First image is primary
          order: index + 1
        };
      });
      
      propertyData.photos = photos;
      logger.debug('Property images processed:', photos.length, 'files');
      logger.debug('Photo URLs:', photos.map(p => p.url));
    } else {
      logger.debug('No files uploaded or files array is invalid');
      propertyData.photos = [];
    }

    logger.debug('Final property data to save:', propertyData);

    // Clean and validate data before saving
    if (propertyData.amenities.length === 0) {
      propertyData.amenities = []; // Ensure empty array if no amenities
    }
    
    // Ensure coordinates are numbers
    if (propertyData.location.coordinates) {
      propertyData.location.coordinates = propertyData.location.coordinates.map(coord => 
        typeof coord === 'string' ? parseFloat(coord) || 0 : coord
      );
    }
    
    // Ensure all numeric fields are actually numbers
    if (propertyData.details.bedrooms) propertyData.details.bedrooms = parseInt(propertyData.details.bedrooms) || 0;
    if (propertyData.details.bathrooms) propertyData.details.bathrooms = parseFloat(propertyData.details.bathrooms) || 0;
    if (propertyData.details.squareMeters) propertyData.details.squareMeters = parseInt(propertyData.details.squareMeters) || 0;
    if (propertyData.details.yearBuilt) propertyData.details.yearBuilt = parseInt(propertyData.details.yearBuilt) || undefined;

    // Log the exact data structure being sent to mongoose
    logger.debug('=== DATABASE SAVE ATTEMPT ===');
    logger.debug('Property data type:', typeof propertyData);
    logger.debug('Property data keys:', Object.keys(propertyData));
    logger.debug('Owner ID:', propertyData.owner);
    logger.debug('Photos array:', propertyData.photos);
    logger.debug('Features object:', propertyData.features);
    logger.debug('Amenities array:', propertyData.amenities);
    
    const property = new Property(propertyData);
    logger.debug('Mongoose model created successfully');
    
    logger.debug('Attempting to save to database...');
    const savedProperty = await property.save();
    logger.debug('Property saved successfully with ID:', savedProperty._id);
    logger.debug('Saved property data:', savedProperty);
    logger.debug('=== DATABASE SAVE SUCCESS ===');
    logger.debug('=== End createProperty controller ===');

    res.status(201).json({
      message: 'Property created successfully',
      property: savedProperty
    });
  } catch (error) {
    logger.error('Create property error:', error);
    logger.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate property found' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create property',
      details: error.message 
    });
  }
};

// Update property (requires authentication + ownership)
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString() && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Not authorized to update this property.' });
    }

    // Only these fields can be edited by the owner. Copying req.body wholesale
    // let owners change owner, featured status, analytics, verification, etc.
    const updateData = {};
    for (const key of ['title', 'description', 'propertyType', 'listingType', 'currency', 'amenities']) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }
    if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
    for (const group of ['address', 'details']) {
      if (req.body[group] && typeof req.body[group] === 'object') {
        for (const [k, v] of Object.entries(req.body[group])) updateData[`${group}.${k}`] = v;
      }
    }
    if (req.body.features && typeof req.body.features === 'object') {
      for (const k of ['parkingAvailable', 'furnished', 'petFriendly']) {
        if (req.body.features[k] !== undefined) updateData[`features.${k}`] = String(req.body.features[k]) === 'true';
      }
    }
    if (req.body.status !== undefined) {
      const allowed = isAdmin(req.user) ? ALL_STATUSES : property.status === 'pending' ? [] : OWNER_STATUSES;
      if (!allowed.includes(req.body.status)) {
        return res.status(403).json({ error: 'You cannot set this listing status.' });
      }
      updateData.status = req.body.status;
    }

    // Handle rental details if it's a rental property
    if (req.body.listingType === 'rental' && req.body.rentalDetails) {
      updateData.rentalDetails = {
        monthlyRent: parseFloat(req.body.rentalDetails.monthlyRent) || 0,
        availableFrom: req.body.rentalDetails.availableFrom ? new Date(req.body.rentalDetails.availableFrom) : null,
        availableUntil: req.body.rentalDetails.availableUntil ? new Date(req.body.rentalDetails.availableUntil) : null,
        minimumLeaseMonths: parseInt(req.body.rentalDetails.minimumLeaseMonths) || 1,
        maximumLeaseMonths: req.body.rentalDetails.maximumLeaseMonths ? parseInt(req.body.rentalDetails.maximumLeaseMonths) : null,
        depositRequired: parseFloat(req.body.rentalDetails.depositRequired) || 0,
        utilitiesIncluded: req.body.rentalDetails.utilitiesIncluded === 'true',
        furnished: req.body.rentalDetails.furnished === 'true'
      };
    }

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const photos = req.files.map((file, index) => ({
        url: file.url,
        caption: file.originalname,
        isPrimary: index === 0, // First image is primary
        order: index + 1
      }));
      
      updateData.photos = photos;
      logger.debug('Property images updated:', photos.length, 'files');
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    logger.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property.' });
  }
};

// Delete property (requires authentication + ownership)
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this property.' });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    logger.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property.' });
  }
};

// Get user's properties
const getUserProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ properties });
  } catch (error) {
    logger.error('Get user properties error:', error);
    res.status(500).json({ error: 'Failed to fetch user properties.' });
  }
};

module.exports = {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getUserProperties
};
