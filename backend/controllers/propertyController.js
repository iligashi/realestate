const { Property, User } = require('../models');
const { Op } = require('sequelize');

// Helper function to parse JSON fields
const parseJsonFields = (property) => {
  if (!property) return property;
  
  const parsedProperty = property.toJSON ? property.toJSON() : property;
  
  // Parse JSON string fields
  const jsonFields = ['photos', 'address', 'details', 'features', 'amenities', 'rentalDetails', 'priceHistory', 'mapData', 'appliances', 'utilities', 'documents', 'neighborhood', 'schools', 'transportation', 'sustainability', 'analytics', 'seo', 'customFields', 'videos', 'virtualTours'];
  
  jsonFields.forEach(field => {
    if (parsedProperty[field] && typeof parsedProperty[field] === 'string') {
      try {
        parsedProperty[field] = JSON.parse(parsedProperty[field]);
      } catch (error) {
        console.warn(`Failed to parse ${field} field:`, error.message);
        parsedProperty[field] = null;
      }
    }
  });
  
  return parsedProperty;
};

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
    if (city) filter['$address.city$'] = { [Op.like]: `%${city}%` };
    if (state) filter['$address.state$'] = { [Op.like]: `%${state}%` };
    if (country) filter['$address.country$'] = { [Op.like]: `%${country}%` };
    if (bedrooms) filter['$details.bedrooms$'] = { [Op.gte]: parseInt(bedrooms) };
    if (bathrooms) filter['$details.bathrooms$'] = { [Op.gte]: parseInt(bathrooms) };
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price[Op.gte] = parseInt(minPrice);
      if (maxPrice) filter.price[Op.lte] = parseInt(maxPrice);
    }

    // Only show active, sold, and rented properties
    filter.status = { [Op.in]: ['active', 'sold', 'rented'] };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const properties = await Property.findAll({
      where: filter,
      include: [{
        model: User,
        as: 'owner',
        attributes: ['firstName', 'lastName', 'email', 'phone', 'avatar']
      }],
      limit: options.limit,
      offset: (options.page - 1) * options.limit,
      order: [['createdAt', 'DESC']]
    });

    const total = await Property.count({ where: filter });

    // Parse JSON fields for each property
    const parsedProperties = properties.map(parseJsonFields);

    res.json({
      properties: parsedProperties,
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
    const property = await Property.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['firstName', 'lastName', 'email', 'phone', 'avatar']
        },
        {
          model: User,
          as: 'agent',
          attributes: ['firstName', 'lastName', 'email', 'phone', 'avatar']
        }
      ]
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Parse JSON fields
    const parsedProperty = parseJsonFields(property);

    res.json({ property: parsedProperty });
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
      ownerId: req.user.id,
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

    // Log the exact data structure being sent to database
    console.log('=== DATABASE SAVE ATTEMPT ===');
    console.log('Property data type:', typeof propertyData);
    console.log('Property data keys:', Object.keys(propertyData));
    console.log('Owner ID:', propertyData.owner);
    console.log('Photos array:', propertyData.photos);
    console.log('Features object:', propertyData.features);
    console.log('Amenities array:', propertyData.amenities);
    
    const savedProperty = await Property.create(propertyData);
    console.log('Property saved successfully with ID:', savedProperty.id);
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
    const property = await Property.findByPk(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Check ownership
    if (property.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this property.' });
    }

    const updateData = { ...req.body };

    // Handle rental details if it's a rental property
    if (req.body.listingType === 'rental' && req.body.rentalDetails) {
      updateData.rental_details = {
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

    await property.update(updateData);
    
    const updatedProperty = await Property.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['firstName', 'lastName', 'email', 'phone', 'avatar']
        },
        {
          model: User,
          as: 'agent',
          attributes: ['firstName', 'lastName', 'email', 'phone', 'avatar']
        }
      ]
    });

    // Parse JSON fields
    const parsedProperty = parseJsonFields(updatedProperty);

    res.json({
      message: 'Property updated successfully',
      property: parsedProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property.' });
  }
};

// Delete property (requires authentication + ownership)
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Check ownership
    if (property.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this property.' });
    }

    await property.destroy();

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property.' });
  }
};

// Get user's properties
const getUserProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      where: { ownerId: req.user.id },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['firstName', 'lastName', 'email', 'phone', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Parse JSON fields for each property
    const parsedProperties = properties.map(parseJsonFields);

    res.json({ properties: parsedProperties });
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
