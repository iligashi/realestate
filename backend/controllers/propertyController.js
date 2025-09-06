const Property = require('../models/Property');

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

    // Build filter object
    const filter = {};
    
    if (propertyType) filter.propertyType = propertyType;
    if (listingType) filter.listingType = listingType;
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (state) filter['address.state'] = { $regex: state, $options: 'i' };
    if (country) filter['address.country'] = { $regex: country, $options: 'i' };
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
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties.' });
  }
};

// Get single property by ID
const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'firstName lastName email phone avatar')
      .populate('agent', 'firstName lastName email phone avatar agent');

    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    res.json({ property });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Failed to fetch property.' });
  }
};

// Create new property (requires authentication)
const createProperty = async (req, res) => {
  try {
    console.log('=== createProperty controller ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    // Defensive check - ensure req.body exists
    if (!req.body) {
      console.error('No request body received');
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
      status: req.body.status || 'active',
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
        bathrooms: parseInt(req.body.details?.bathrooms) || 0,
        squareMeters: parseInt(req.body.details?.squareMeters) || 0,
        yearBuilt: parseInt(req.body.details?.yearBuilt) || 2025
      },
      features: {
        parkingAvailable: req.body.features?.parkingAvailable === 'true',
        furnished: req.body.features?.furnished === 'true',
        petFriendly: req.body.features?.petFriendly === 'true',
        featured: req.body.features?.featured === 'true'
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
      console.log('Processing uploaded files:', req.files.length);
      
      const photos = req.files.map((file, index) => {
        console.log(`Processing file ${index + 1}:`, file.originalname);
        return {
          url: `/uploads/property-images/${file.filename}`,
          caption: file.originalname,
          isPrimary: index === 0, // First image is primary
          order: index + 1
        };
      });
      
      propertyData.photos = photos;
      console.log('Property images processed:', photos.length, 'files');
      console.log('Photo URLs:', photos.map(p => p.url));
    } else {
      console.log('No files uploaded or files array is invalid');
      propertyData.photos = [];
    }

    console.log('Final property data to save:', propertyData);

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
    if (propertyData.details.bathrooms) propertyData.details.bathrooms = parseInt(propertyData.details.bathrooms) || 0;
    if (propertyData.details.squareMeters) propertyData.details.squareMeters = parseInt(propertyData.details.squareMeters) || 0;
    if (propertyData.details.yearBuilt) propertyData.details.yearBuilt = parseInt(propertyData.details.yearBuilt) || 2025;

    // Log the exact data structure being sent to mongoose
    console.log('=== DATABASE SAVE ATTEMPT ===');
    console.log('Property data type:', typeof propertyData);
    console.log('Property data keys:', Object.keys(propertyData));
    console.log('Owner ID:', propertyData.owner);
    console.log('Photos array:', propertyData.photos);
    console.log('Features object:', propertyData.features);
    console.log('Amenities array:', propertyData.amenities);
    
    const property = new Property(propertyData);
    console.log('Mongoose model created successfully');
    
    console.log('Attempting to save to database...');
    const savedProperty = await property.save();
    console.log('Property saved successfully with ID:', savedProperty._id);
    console.log('Saved property data:', savedProperty);
    console.log('=== DATABASE SAVE SUCCESS ===');
    console.log('=== End createProperty controller ===');

    res.status(201).json({
      message: 'Property created successfully',
      property: savedProperty
    });
  } catch (error) {
    console.error('Create property error:', error);
    console.error('Error stack:', error.stack);
    
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
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this property.' });
    }

    const updateData = { ...req.body };

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
        url: `/uploads/property-images/${file.filename}`,
        caption: file.originalname,
        isPrimary: index === 0, // First image is primary
        order: index + 1
      }));
      
      updateData.photos = photos;
      console.log('Property images updated:', photos.length, 'files');
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
    console.error('Update property error:', error);
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
    console.error('Delete property error:', error);
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
    console.error('Get user properties error:', error);
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
