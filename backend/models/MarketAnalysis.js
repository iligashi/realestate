const mongoose = require('mongoose');

const marketAnalysisSchema = new mongoose.Schema({
  // Agent Information
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Analysis Scope
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: String,
    neighborhood: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  
  // Analysis Period
  analysisPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    type: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'custom'],
      default: 'monthly'
    }
  },
  
  // Market Overview
  marketOverview: {
    totalListings: Number,
    newListings: Number,
    soldListings: Number,
    pendingListings: Number,
    withdrawnListings: Number,
    expiredListings: Number
  },
  
  // Pricing Data
  pricing: {
    averagePrice: Number,
    medianPrice: Number,
    pricePerSqFt: Number,
    highestPrice: Number,
    lowestPrice: Number,
    priceRange: {
      under200k: Number,
      '200k-300k': Number,
      '300k-500k': Number,
      '500k-750k': Number,
      '750k-1m': Number,
      over1m: Number
    }
  },
  
  // Market Trends
  trends: {
    priceChange: {
      monthOverMonth: Number,
      yearOverYear: Number,
      trend: {
        type: String,
        enum: ['rising', 'falling', 'stable', 'volatile']
      }
    },
    inventoryChange: {
      monthOverMonth: Number,
      yearOverYear: Number,
      trend: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable']
      }
    },
    daysOnMarket: {
      average: Number,
      median: Number,
      trend: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable']
      }
    },
    salesVelocity: {
      average: Number,
      trend: {
        type: String,
        enum: ['accelerating', 'slowing', 'stable']
      }
    }
  },
  
  // Market Conditions
  marketConditions: {
    type: {
      type: String,
      enum: ['buyers_market', 'sellers_market', 'balanced_market'],
      required: true
    },
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    factors: [String], // Factors influencing market conditions
    description: String
  },
  
  // Property Type Analysis
  propertyTypeAnalysis: [{
    type: {
      type: String,
      enum: ['single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial']
    },
    averagePrice: Number,
    medianPrice: Number,
    daysOnMarket: Number,
    inventory: Number,
    sales: Number,
    priceChange: Number
  }],
  
  // Neighborhood Analysis
  neighborhoodAnalysis: [{
    name: String,
    averagePrice: Number,
    medianPrice: Number,
    daysOnMarket: Number,
    inventory: Number,
    sales: Number,
    priceChange: Number,
    marketShare: Number // percentage of total market
  }],
  
  // Comparative Market Analysis (CMA)
  cma: {
    subjectProperty: {
      address: String,
      bedrooms: Number,
      bathrooms: Number,
      squareFeet: Number,
      lotSize: Number,
      yearBuilt: Number,
      estimatedValue: Number
    },
    comparableProperties: [{
      address: String,
      bedrooms: Number,
      bathrooms: Number,
      squareFeet: Number,
      lotSize: Number,
      yearBuilt: Number,
      soldPrice: Number,
      soldDate: Date,
      daysOnMarket: Number,
      adjustments: [{
        feature: String,
        adjustment: Number,
        reason: String
      }],
      adjustedPrice: Number
    }],
    estimatedValue: {
      low: Number,
      high: Number,
      mostLikely: Number
    },
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  
  // Forecast and Predictions
  forecast: {
    next3Months: {
      priceChange: Number,
      inventoryChange: Number,
      marketActivity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      confidence: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    },
    next6Months: {
      priceChange: Number,
      inventoryChange: Number,
      marketActivity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      confidence: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    },
    next12Months: {
      priceChange: Number,
      inventoryChange: Number,
      marketActivity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      confidence: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }
  },
  
  // Key Insights and Recommendations
  insights: [{
    category: {
      type: String,
      enum: ['pricing', 'timing', 'marketing', 'investment', 'risk', 'opportunity']
    },
    title: String,
    description: String,
    impact: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    actionable: Boolean
  }],
  
  // Data Sources and Methodology
  dataSources: [String],
  methodology: String,
  lastUpdated: { type: Date, default: Date.now },
  
  // Charts and Visualizations
  charts: [{
    type: {
      type: String,
      enum: ['price_trend', 'inventory_trend', 'sales_volume', 'days_on_market', 'price_distribution', 'market_share']
    },
    title: String,
    data: mongoose.Schema.Types.Mixed,
    config: mongoose.Schema.Types.Mixed
  }],
  
  // Sharing and Access
  isPublic: { type: Boolean, default: false },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
marketAnalysisSchema.index({ agentId: 1, 'analysisPeriod.endDate': -1 });
marketAnalysisSchema.index({ 'location.coordinates': '2dsphere' });
marketAnalysisSchema.index({ 'location.city': 1, 'location.state': 1 });
marketAnalysisSchema.index({ 'analysisPeriod.type': 1, 'analysisPeriod.endDate': -1 });
marketAnalysisSchema.index({ isPublic: 1, createdAt: -1 });

// Pre-save middleware
marketAnalysisSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastUpdated = new Date();
  next();
});

// Virtual fields
marketAnalysisSchema.virtual('isCurrent').get(function() {
  const now = new Date();
  return this.analysisPeriod.endDate >= now;
});

marketAnalysisSchema.virtual('marketHealth').get(function() {
  const trends = this.trends;
  let health = 'stable';
  
  if (trends.priceChange.yearOverYear > 5 && trends.inventoryChange.yearOverYear < -10) {
    health = 'strong';
  } else if (trends.priceChange.yearOverYear < -5 || trends.inventoryChange.yearOverYear > 20) {
    health = 'weak';
  } else if (trends.daysOnMarket.trend === 'increasing' && trends.salesVelocity.trend === 'slowing') {
    health = 'declining';
  }
  
  return health;
});

// Static methods
marketAnalysisSchema.statics.getLatestAnalysis = function(agentId, location) {
  const query = { agentId };
  if (location) {
    query['location.city'] = location.city;
    query['location.state'] = location.state;
  }
  
  return this.findOne(query).sort({ 'analysisPeriod.endDate': -1 });
};

marketAnalysisSchema.statics.getMarketTrends = function(location, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  return this.find({
    'location.city': location.city,
    'location.state': location.state,
    'analysisPeriod.endDate': { $gte: startDate }
  }).sort({ 'analysisPeriod.endDate': 1 });
};

module.exports = mongoose.model('MarketAnalysis', marketAnalysisSchema);
