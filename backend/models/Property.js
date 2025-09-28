const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  propertyType: {
    type: String,
    enum: ['house', 'apartment', 'office', 'land', 'commercial'],
    required: true
  },
  listingType: {
    type: String,
    enum: ['sale', 'rent', 'rental', 'auction', 'pre-construction'],
    required: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK']
  },
  priceHistory: [{
    price: Number,
    date: { type: Date, default: Date.now },
    reason: String
  }],
  rentPeriod: {
    type: String,
    enum: ['monthly', 'weekly', 'daily', 'yearly'],
    default: 'monthly'
  },
  
  // Rental-specific details
  rentalDetails: {
    securityDeposit: Number,
    petDeposit: Number,
    petRent: Number,
    utilities: [String],
    leaseLength: Number,
    leaseType: {
      type: String,
      enum: ['fixed', 'month-to-month', 'flexible']
    }
  },
  
  // Location
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Property Details
  details: {
    bedrooms: Number,
    bathrooms: Number,
    squareMeters: Number,
    squareFeet: Number,
    yearBuilt: Number,
    lotSize: Number,
    parking: {
      type: String,
      enum: ['none', 'street', 'garage', 'covered', 'uncovered']
    },
    parkingSpaces: Number,
    floors: Number,
    basement: Boolean,
    attic: Boolean,
    garden: Boolean,
    balcony: Boolean,
    terrace: Boolean,
    pool: Boolean,
    fireplace: Boolean,
    airConditioning: Boolean,
    heating: {
      type: String,
      enum: ['none', 'central', 'electric', 'gas', 'oil', 'wood']
    },
    cooling: {
      type: String,
      enum: ['none', 'central', 'window', 'portable']
    }
  },
  
  // Features and Amenities
  features: [String],
  amenities: [String],
  
  // Media
  photos: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
  }],
  virtualTour: String,
  videoUrl: String,
  
  // Status and Availability
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'sold', 'rented'],
    default: 'active'
  },
  availability: {
    type: String,
    enum: ['immediate', 'custom', 'negotiable'],
    default: 'immediate'
  },
  availabilityDate: Date,
  
  // Ownership and Management
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // SEO and Marketing
  featured: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0
  },
  tags: [String],
  
  // Legal and Compliance
  legalInfo: {
    propertyTax: Number,
    hoaFees: Number,
    hoaFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually']
    },
    zoning: String,
    permits: [String]
  },
  
  // Additional Information
  notes: String,
  restrictions: [String],
  disclosures: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
propertySchema.index({ propertyType: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ 'address.city': 1 });
propertySchema.index({ 'address.state': 1 });
propertySchema.index({ 'address.coordinates': '2dsphere' });
propertySchema.index({ featured: 1, priority: -1 });
propertySchema.index({ createdAt: -1 });

// Virtual fields
propertySchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr) return '';
  return `${addr.street || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zipCode || ''} ${addr.country || ''}`.trim();
});

propertySchema.virtual('pricePerSqMeter').get(function() {
  if (this.details && this.details.squareMeters && this.details.squareMeters > 0) {
    return this.price / this.details.squareMeters;
  }
  return null;
});

// Instance methods
propertySchema.methods.getFullAddress = function() {
  const addr = this.address;
  if (!addr || typeof addr !== 'object') {
    return '';
  }
  return `${addr.street || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zipCode || ''} ${addr.country || ''}`.trim();
};

propertySchema.methods.getPricePerSqMeter = function() {
  if (this.details && this.details.squareMeters && this.details.squareMeters > 0) {
    return this.price / this.details.squareMeters;
  }
  return null;
};

propertySchema.methods.checkAvailability = function() {
  return this.status === 'active' && this.availability !== 'custom';
};

// Static methods
propertySchema.statics.findByPriceRange = function(minPrice, maxPrice) {
  return this.find({
    price: { $gte: minPrice, $lte: maxPrice }
  });
};

propertySchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Pre-save middleware
propertySchema.pre('save', function(next) {
  // Ensure at least one photo is marked as primary
  if (this.photos && this.photos.length > 0) {
    const hasPrimary = this.photos.some(photo => photo.isPrimary);
    if (!hasPrimary) {
      this.photos[0].isPrimary = true;
    }
  }
  next();
});

module.exports = mongoose.model('Property', propertySchema);