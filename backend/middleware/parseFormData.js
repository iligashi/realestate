const logger = require('../utils/logger');
const parseFormData = (req, res, next) => {
  logger.debug('=== parseFormData middleware ===');
  logger.debug('Raw req.body keys:', Object.keys(req.body));
  logger.debug('Raw req.body values:', Object.values(req.body));
  
  try {
    // Parse FormData bracket notation into nested objects
    const parsedBody = {};
    
    for (const [key, value] of Object.entries(req.body)) {
      if (key.includes('[') && key.includes(']')) {
        // Handle bracket notation like 'address[city]' -> address.city
        const match = key.match(/^([^[]+)\[([^\]]+)\](\[([^\]]+)\])?$/);
        
        if (match) {
          const [, mainKey, subKey, , subSubKey] = match;
          
          if (!parsedBody[mainKey]) {
            parsedBody[mainKey] = {};
          }
          
          if (subSubKey) {
            // Handle nested arrays like 'location[coordinates][0]'
            if (!parsedBody[mainKey][subKey]) {
              parsedBody[mainKey][subKey] = [];
            }
            parsedBody[mainKey][subKey][parseInt(subSubKey)] = value;
          } else {
            // Handle simple nested like 'address[city]'
            parsedBody[mainKey][subKey] = value;
          }
        }
      } else {
        // Handle flat keys
        parsedBody[key] = value;
      }
    }
    
    // Handle array fields like amenities[0], amenities[1]
    for (const [key, value] of Object.entries(req.body)) {
      const arrayMatch = key.match(/^([^[]+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        if (!parsedBody[arrayName]) {
          parsedBody[arrayName] = [];
        }
        parsedBody[arrayName][parseInt(index)] = value;
      }
    }
    
    // Convert string numbers back to numbers where appropriate
    if (parsedBody.price) {
      parsedBody.price = parseFloat(parsedBody.price) || 0;
    }
    if (parsedBody.details) {
      if (parsedBody.details.bedrooms) parsedBody.details.bedrooms = parseInt(parsedBody.details.bedrooms) || 0;
      if (parsedBody.details.bathrooms) parsedBody.details.bathrooms = parseInt(parsedBody.details.bathrooms) || 0;
      if (parsedBody.details.squareMeters) parsedBody.details.squareMeters = parseInt(parsedBody.details.squareMeters) || 0;
      if (parsedBody.details.yearBuilt) parsedBody.details.yearBuilt = parseInt(parsedBody.details.yearBuilt) || 2025;
    }
    if (parsedBody.features) {
      if (parsedBody.features.parkingAvailable) parsedBody.features.parkingAvailable = parsedBody.features.parkingAvailable === 'true';
      if (parsedBody.features.furnished) parsedBody.features.furnished = parsedBody.features.furnished === 'true';
      if (parsedBody.features.petFriendly) parsedBody.features.petFriendly = parsedBody.features.petFriendly === 'true';
      if (parsedBody.features.featured) parsedBody.features.featured = parsedBody.features.featured === 'true';
    }
    
    // Replace req.body with parsed data
    req.body = parsedBody;
    
    logger.debug('Parsed body:', parsedBody);
    logger.debug('=== End parseFormData middleware - Data parsed successfully ===');
    
  } catch (error) {
    logger.error('Error parsing FormData:', error);
    return res.status(400).json({ 
      error: 'Failed to parse form data',
      details: error.message 
    });
  }
  
  next();
};

module.exports = parseFormData;
