const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  // User who saved the property
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Saved property
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  
  // Favorite metadata
  savedAt: {
    type: Date,
    default: Date.now
  },
  
  // User notes about this property
  notes: {
    type: String,
    maxlength: 500
  },
  
  // Tags for organization
  tags: [String],
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Alert settings
  alerts: {
    priceChanges: { type: Boolean, default: true },
    statusChanges: { type: Boolean, default: true },
    newPhotos: { type: Boolean, default: false },
    similarProperties: { type: Boolean, default: true }
  },
  
  // Price tracking
  priceTracking: {
    originalPrice: Number,
    currentPrice: Number,
    priceHistory: [{
      price: Number,
      date: { type: Date, default: Date.now },
      change: Number,
      percentageChange: Number
    }],
    lastChecked: Date
  },
  
  // Viewing history
  viewHistory: [{
    date: { type: Date, default: Date.now },
    duration: Number // in seconds
  }],
  
  // Comparison data
  comparisonData: {
    isInComparison: { type: Boolean, default: false },
    comparisonRank: Number,
    comparisonNotes: String
  },
  
  // Sharing settings
  sharing: {
    isShared: { type: Boolean, default: false },
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      sharedAt: { type: Date, default: Date.now },
      canEdit: { type: Boolean, default: false }
    }]
  },
  
  // Reminder settings
  reminders: [{
    type: String, // 'view', 'contact', 'visit', 'custom'
    date: Date,
    message: String,
    isCompleted: { type: Boolean, default: false },
    completedAt: Date
  }],
  
  // Analytics
  analytics: {
    timesViewed: { type: Number, default: 0 },
    lastViewed: Date,
    totalViewTime: { type: Number, default: 0 }, // in seconds
    inquirySent: { type: Boolean, default: false },
    inquiryDate: Date
  }
}, {
  timestamps: true
});

// Indexes
favoriteSchema.index({ user: 1, property: 1 }, { unique: true });
favoriteSchema.index({ user: 1, savedAt: -1 });
favoriteSchema.index({ property: 1 });
favoriteSchema.index({ 'priceTracking.lastChecked': 1 });
favoriteSchema.index({ tags: 1 });

// Virtual fields
favoriteSchema.virtual('isPriceIncreased').get(function() {
  if (this.priceTracking.originalPrice && this.priceTracking.currentPrice) {
    return this.priceTracking.currentPrice > this.priceTracking.originalPrice;
  }
  return false;
});

favoriteSchema.virtual('priceChangePercentage').get(function() {
  if (this.priceTracking.originalPrice && this.priceTracking.currentPrice) {
    return ((this.priceTracking.currentPrice - this.priceTracking.originalPrice) / this.priceTracking.originalPrice) * 100;
  }
  return 0;
});

favoriteSchema.virtual('daysSinceSaved').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.savedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance methods
favoriteSchema.methods.updatePrice = function(newPrice) {
  const oldPrice = this.priceTracking.currentPrice || this.priceTracking.originalPrice;
  
  if (oldPrice && newPrice !== oldPrice) {
    const change = newPrice - oldPrice;
    const percentageChange = (change / oldPrice) * 100;
    
    this.priceTracking.priceHistory.push({
      price: newPrice,
      date: new Date(),
      change: change,
      percentageChange: percentageChange
    });
    
    this.priceTracking.currentPrice = newPrice;
    this.priceTracking.lastChecked = new Date();
    
    // Keep only last 10 price changes
    if (this.priceTracking.priceHistory.length > 10) {
      this.priceTracking.priceHistory = this.priceTracking.priceHistory.slice(-10);
    }
  }
  
  return this.save();
};

favoriteSchema.methods.addView = function(duration = 0) {
  this.viewHistory.push({
    date: new Date(),
    duration: duration
  });
  
  this.analytics.timesViewed += 1;
  this.analytics.lastViewed = new Date();
  this.analytics.totalViewTime += duration;
  
  // Keep only last 50 views
  if (this.viewHistory.length > 50) {
    this.viewHistory = this.viewHistory.slice(-50);
  }
  
  return this.save();
};

favoriteSchema.methods.addReminder = function(type, date, message = '') {
  this.reminders.push({
    type: type,
    date: date,
    message: message
  });
  return this.save();
};

favoriteSchema.methods.completeReminder = function(reminderId) {
  const reminder = this.reminders.id(reminderId);
  if (reminder) {
    reminder.isCompleted = true;
    reminder.completedAt = new Date();
  }
  return this.save();
};

favoriteSchema.methods.shareWithUser = function(userId, canEdit = false) {
  if (!this.sharing.sharedWith.some(share => share.userId.equals(userId))) {
    this.sharing.sharedWith.push({
      userId: userId,
      sharedAt: new Date(),
      canEdit: canEdit
    });
    this.sharing.isShared = true;
  }
  return this.save();
};

favoriteSchema.methods.removeSharedUser = function(userId) {
  this.sharing.sharedWith = this.sharing.sharedWith.filter(share => !share.userId.equals(userId));
  this.sharing.isShared = this.sharing.sharedWith.length > 0;
  return this.save();
};

// Static methods
favoriteSchema.statics.findUserFavorites = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  return this.find(query)
    .populate('property', 'title photos address price status propertyType')
    .sort({ savedAt: -1 });
};

favoriteSchema.statics.findPriceAlerts = function() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return this.find({
    'alerts.priceChanges': true,
    'priceTracking.lastChecked': { $lt: yesterday }
  }).populate('property', 'price title address');
};

// Pre-save middleware
favoriteSchema.pre('save', function(next) {
  if (this.isNew && !this.priceTracking.originalPrice) {
    this.priceTracking.originalPrice = this.priceTracking.currentPrice;
  }
  next();
});

module.exports = mongoose.model('Favorite', favoriteSchema);
