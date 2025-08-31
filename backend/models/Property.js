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
    enum: ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial', 'industrial', 'office', 'retail', 'warehouse'],
    required: true
  },
  listingType: {
    type: String,
    enum: ['sale', 'rent', 'auction', 'pre-construction'],
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
  
  // Location & Address
  address: {
    street: String,
    city: { type: String, required: true },
    state: String,
    zipCode: String,
    country: { type: String, required: true },
    neighborhood: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  mapData: {
    placeId: String,
    formattedAddress: String,
    streetNumber: String,
    route: String,
    locality: String,
    administrativeArea: String,
    country: String,
    postalCode: String
  },
  
  // Property Details
  details: {
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },
    halfBathrooms: { type: Number, min: 0 },
    totalRooms: { type: Number, min: 0 },
    squareMeters: { type: Number, min: 0 },
    squareFeet: { type: Number, min: 0 },
    lotSize: { type: Number, min: 0 },
    yearBuilt: Number,
    floors: Number,
    parkingSpaces: { type: Number, min: 0 },
    garageType: String
  },
  
  // Features & Amenities
  features: [String],
  amenities: [String],
  appliances: [String],
  heating: String,
  
  // Featured Listing
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredAt: Date,
  featuredUntil: Date,
  featuredPrice: {
    type: Number,
    min: 0
  },
  cooling: String,
  utilities: [String],
  
  // Media
  photos: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false },
    order: Number
  }],
  videos: [{
    url: String,
    type: { type: String, enum: ['youtube', 'vimeo', 'upload', '360', 'drone'] },
    caption: String,
    duration: Number
  }],
  virtualTours: [{
    url: String,
    type: { type: String, enum: ['3d', '360', 'ar', 'vr'] },
    description: String
  }],
  
  // Status & Availability
  status: {
    type: String,
    enum: ['active', 'pending', 'sold', 'rented', 'inactive', 'under-contract'],
    default: 'active'
  },
  availability: {
    type: String,
    enum: ['immediate', '30-days', '60-days', '90-days', 'custom'],
    default: 'immediate'
  },
  availableFrom: Date,
  featured: { type: Boolean, default: false },
  premium: { type: Boolean, default: false },
  
  // Ownership & Agent
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  agency: String,
  
  // Financial & Legal
  propertyTax: Number,
  hoaFees: Number,
  hoaFrequency: String,
  insurance: Number,
  utilities: {
    electricity: Number,
    water: Number,
    gas: Number,
    internet: Number
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    verified: { type: Boolean, default: false }
  }],
  
  // Neighborhood & School Info
  neighborhood: {
    walkScore: Number,
    transitScore: Number,
    bikeScore: Number,
    crimeRate: String,
    demographics: {
      population: Number,
      medianAge: Number,
      medianIncome: Number
    }
  },
  schools: [{
    name: String,
    type: String,
    rating: Number,
    distance: Number,
    grades: String
  }],
  
  // Transportation
  transportation: {
    nearbyStations: [{
      name: String,
      type: String,
      distance: Number,
      lines: [String]
    }],
    highways: [{
      name: String,
      distance: Number
    }]
  },
  
  // Sustainability & Energy
  sustainability: {
    energyRating: String,
    solarPotential: String,
    greenScore: Number,
    energyEfficient: Boolean,
    renewableEnergy: [String]
  },
  
  // Analytics & Performance
  analytics: {
    views: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    lastViewed: Date,
    viewHistory: [{
      userId: mongoose.Schema.Types.ObjectId,
      timestamp: { type: Date, default: Date.now }
    }]
  },
  
  // SEO & Marketing
  seo: {
    keywords: [String],
    metaDescription: String,
    slug: String
  },
  
  // Verification & Trust
  verified: { type: Boolean, default: false },
  verificationDate: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Custom Fields (for different property types)
  customFields: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  listedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
propertySchema.index({ 'location.coordinates': '2dsphere' });
propertySchema.index({ status: 1, featured: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ 'address.city': 1, 'address.state': 1 });
propertySchema.index({ propertyType: 1, listingType: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ agent: 1 });
propertySchema.index({ verified: 1 });
propertySchema.index({ createdAt: -1 });

// Text search index
propertySchema.index({
  title: 'text',
  description: 'text',
  'address.city': 'text',
  'address.neighborhood': 'text'
});

// Virtual fields
propertySchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zipCode || ''} ${addr.country || ''}`.trim();
});

propertySchema.virtual('pricePerSqMeter').get(function() {
  if (this.details.squareMeters && this.details.squareMeters > 0) {
    return this.price / this.details.squareMeters;
  }
  return null;
});

propertySchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && this.availability !== 'custom';
});

// Pre-save middleware
propertySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static methods
propertySchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    'location.coordinates': {
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

propertySchema.statics.findByPriceRange = function(minPrice, maxPrice) {
  return this.find({
    price: { $gte: minPrice, $lte: maxPrice }
  });
};

module.exports = mongoose.model('Property', propertySchema);
