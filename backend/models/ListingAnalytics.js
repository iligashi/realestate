const mongoose = require('mongoose');

const listingAnalyticsSchema = new mongoose.Schema({
  // Basic Information
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // View Analytics
  views: {
    total: { type: Number, default: 0 },
    unique: { type: Number, default: 0 },
    today: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Engagement Metrics
  saves: {
    total: { type: Number, default: 0 },
    today: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 }
  },
  
  shares: {
    total: { type: Number, default: 0 },
    email: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    direct: { type: Number, default: 0 }
  },
  
  // Inquiry Analytics
  inquiries: {
    total: { type: Number, default: 0 },
    today: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    byType: {
      general: { type: Number, default: 0 },
      viewing: { type: Number, default: 0 },
      offer: { type: Number, default: 0 },
      negotiation: { type: Number, default: 0 }
    }
  },
  
  // Response Metrics
  responseTime: {
    average: { type: Number, default: 0 }, // in hours
    median: { type: Number, default: 0 },
    best: { type: Number, default: 0 },
    worst: { type: Number, default: 0 }
  },
  
  // Conversion Metrics
  conversion: {
    viewsToInquiries: { type: Number, default: 0 }, // percentage
    inquiriesToShowings: { type: Number, default: 0 },
    showingsToOffers: { type: Number, default: 0 },
    offersToClose: { type: Number, default: 0 }
  },
  
  // Traffic Sources
  trafficSources: {
    direct: { type: Number, default: 0 },
    search: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    referral: { type: Number, default: 0 },
    email: { type: Number, default: 0 },
    paid: { type: Number, default: 0 }
  },
  
  // Device Analytics
  devices: {
    desktop: { type: Number, default: 0 },
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 }
  },
  
  // Geographic Analytics
  locations: [{
    city: String,
    state: String,
    country: String,
    views: { type: Number, default: 0 }
  }],
  
  // Time-based Analytics
  hourlyViews: [{
    hour: Number, // 0-23
    views: { type: Number, default: 0 }
  }],
  
  dailyViews: [{
    date: Date,
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 }
  }],
  
  weeklyViews: [{
    week: String, // YYYY-WW format
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 }
  }],
  
  monthlyViews: [{
    month: String, // YYYY-MM format
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 }
  }],
  
  // Price Change Impact
  priceChanges: [{
    oldPrice: Number,
    newPrice: Number,
    changeDate: Date,
    viewsBefore: Number,
    viewsAfter: Number,
    inquiriesBefore: Number,
    inquiriesAfter: Number,
    impact: String // 'positive', 'negative', 'neutral'
  }],
  
  // Competitor Analysis
  competitorData: {
    averagePriceInArea: Number,
    averageDaysOnMarket: Number,
    similarProperties: [{
      propertyId: mongoose.Schema.Types.ObjectId,
      price: Number,
      daysOnMarket: Number,
      status: String
    }]
  },
  
  // Market Trends
  marketTrends: {
    averageViewsPerDay: Number,
    averageInquiriesPerWeek: Number,
    marketActivity: {
      type: String,
      enum: ['low', 'medium', 'high', 'very-high'],
      default: 'medium'
    },
    seasonalTrends: [{
      month: Number,
      averageViews: Number,
      averageInquiries: Number
    }]
  },
  
  // Performance Score
  performanceScore: {
    overall: { type: Number, default: 0 }, // 0-100
    views: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    response: { type: Number, default: 0 },
    conversion: { type: Number, default: 0 },
    lastCalculated: Date
  },
  
  // Recommendations
  recommendations: [{
    type: {
      type: String,
      enum: ['price', 'photos', 'description', 'marketing', 'timing'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    title: String,
    description: String,
    impact: String,
    action: String,
    generatedAt: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
listingAnalyticsSchema.index({ property: 1, seller: 1 });
listingAnalyticsSchema.index({ seller: 1, 'views.lastUpdated': -1 });
listingAnalyticsSchema.index({ 'dailyViews.date': -1 });
listingAnalyticsSchema.index({ 'performanceScore.overall': -1 });

// Pre-save middleware
listingAnalyticsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
listingAnalyticsSchema.methods.recordView = function(userId = null, source = 'direct', device = 'desktop', location = null) {
  this.views.total += 1;
  this.views.today += 1;
  this.views.thisWeek += 1;
  this.views.thisMonth += 1;
  this.views.lastUpdated = new Date();
  
  // Update traffic sources
  if (this.trafficSources[source] !== undefined) {
    this.trafficSources[source] += 1;
  }
  
  // Update device analytics
  if (this.devices[device] !== undefined) {
    this.devices[device] += 1;
  }
  
  // Update location analytics
  if (location) {
    const existingLocation = this.locations.find(loc => 
      loc.city === location.city && loc.state === location.state
    );
    if (existingLocation) {
      existingLocation.views += 1;
    } else {
      this.locations.push({
        city: location.city,
        state: location.state,
        country: location.country,
        views: 1
      });
    }
  }
  
  // Update hourly views
  const currentHour = new Date().getHours();
  const hourlyView = this.hourlyViews.find(hv => hv.hour === currentHour);
  if (hourlyView) {
    hourlyView.views += 1;
  } else {
    this.hourlyViews.push({ hour: currentHour, views: 1 });
  }
  
  return this.save();
};

listingAnalyticsSchema.methods.recordSave = function() {
  this.saves.total += 1;
  this.saves.today += 1;
  this.saves.thisWeek += 1;
  this.saves.thisMonth += 1;
  return this.save();
};

listingAnalyticsSchema.methods.recordInquiry = function(type = 'general') {
  this.inquiries.total += 1;
  this.inquiries.today += 1;
  this.inquiries.thisWeek += 1;
  this.inquiries.thisMonth += 1;
  
  if (this.inquiries.byType[type] !== undefined) {
    this.inquiries.byType[type] += 1;
  }
  
  return this.save();
};

listingAnalyticsSchema.methods.recordPriceChange = function(oldPrice, newPrice, viewsBefore, inquiriesBefore) {
  const priceChange = {
    oldPrice,
    newPrice,
    changeDate: new Date(),
    viewsBefore,
    viewsAfter: this.views.total,
    inquiriesBefore,
    inquiriesAfter: this.inquiries.total,
    impact: 'neutral'
  };
  
  // Calculate impact
  const viewsChange = ((this.views.total - viewsBefore) / viewsBefore) * 100;
  const inquiriesChange = ((this.inquiries.total - inquiriesBefore) / inquiriesBefore) * 100;
  
  if (viewsChange > 10 && inquiriesChange > 10) {
    priceChange.impact = 'positive';
  } else if (viewsChange < -10 || inquiriesChange < -10) {
    priceChange.impact = 'negative';
  }
  
  this.priceChanges.push(priceChange);
  return this.save();
};

listingAnalyticsSchema.methods.calculatePerformanceScore = function() {
  // Calculate overall performance score (0-100)
  const viewsScore = Math.min((this.views.total / 100) * 25, 25);
  const engagementScore = Math.min(((this.saves.total + this.shares.total) / 50) * 25, 25);
  const responseScore = this.responseTime.average > 0 ? Math.max(25 - (this.responseTime.average / 24), 0) : 0;
  const conversionScore = Math.min((this.inquiries.total / 20) * 25, 25);
  
  const overallScore = viewsScore + engagementScore + responseScore + conversionScore;
  
  this.performanceScore = {
    overall: Math.round(overallScore),
    views: Math.round(viewsScore),
    engagement: Math.round(engagementScore),
    response: Math.round(responseScore),
    conversion: Math.round(conversionScore),
    lastCalculated: new Date()
  };
  
  return this.save();
};

// Static methods
listingAnalyticsSchema.statics.getAnalyticsBySeller = function(sellerId, period = '30d') {
  const filter = { seller: sellerId };
  
  return this.find(filter)
    .populate('property', 'title address price status')
    .sort({ 'views.lastUpdated': -1 });
};

listingAnalyticsSchema.statics.getTopPerformers = function(sellerId, limit = 5) {
  return this.find({ seller: sellerId })
    .populate('property', 'title address price photos')
    .sort({ 'performanceScore.overall': -1 })
    .limit(limit);
};

module.exports = mongoose.model('ListingAnalytics', listingAnalyticsSchema);
