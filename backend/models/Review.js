const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Review author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Review target (what's being reviewed)
  targetType: {
    type: String,
    enum: ['property', 'agent', 'neighborhood', 'agency'],
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType',
    required: true
  },
  
  // Review content
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Ratings (1-5 scale)
  ratings: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Property-specific ratings
    property: {
      cleanliness: { type: Number, min: 1, max: 5 },
      maintenance: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      amenities: { type: Number, min: 1, max: 5 }
    },
    // Agent-specific ratings
    agent: {
      communication: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
      knowledge: { type: Number, min: 1, max: 5 },
      responsiveness: { type: Number, min: 1, max: 5 },
      negotiation: { type: Number, min: 1, max: 5 }
    },
    // Neighborhood-specific ratings
    neighborhood: {
      safety: { type: Number, min: 1, max: 5 },
      walkability: { type: Number, min: 1, max: 5 },
      schools: { type: Number, min: 1, max: 5 },
      shopping: { type: Number, min: 1, max: 5 },
      transportation: { type: Number, min: 1, max: 5 }
    }
  },
  
  // Review metadata
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Review status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  
  // Moderation
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  moderationNotes: String,
  
  // Flags and reports
  flags: [{
    reason: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' }
  }],
  
  // Helpfulness voting
  helpful: {
    yes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    no: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  // Media attachments
  photos: [{
    url: String,
    caption: String,
    verified: { type: Boolean, default: false }
  }],
  
  // Review context
  context: {
    purchasePrice: Number,
    purchaseDate: Date,
    propertyType: String,
    transactionType: String, // 'buy', 'rent', 'sell'
    duration: Number // months lived/owned
  },
  
  // Tags and categories
  tags: [String],
  category: String,
  
  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    helpfulScore: { type: Number, default: 0 },
    responseRate: Number // for agent reviews
  },
  
  // Response from target (for agent/agency reviews)
  response: {
    content: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ targetType: 1, target: 1 });
reviewSchema.index({ author: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ 'ratings.overall': -1 });
reviewSchema.index({ verified: 1 });
reviewSchema.index({ tags: 1 });

// Text search index
reviewSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
});

// Virtual fields
reviewSchema.virtual('helpfulScore').get(function() {
  const yesCount = this.helpful.yes.length;
  const noCount = this.helpful.no.length;
  const total = yesCount + noCount;
  return total > 0 ? Math.round((yesCount / total) * 100) : 0;
});

reviewSchema.virtual('averageRating').get(function() {
  if (this.targetType === 'property' && this.ratings.property) {
    const ratings = Object.values(this.ratings.property).filter(r => r);
    return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : this.ratings.overall;
  }
  return this.ratings.overall;
});

reviewSchema.virtual('isVerified').get(function() {
  return this.verified && this.status === 'approved';
});

reviewSchema.virtual('hasResponse').get(function() {
  return this.response && this.response.content;
});

// Instance methods
reviewSchema.methods.markHelpful = function(userId, isHelpful) {
  if (isHelpful) {
    if (!this.helpful.yes.includes(userId)) {
      this.helpful.yes.push(userId);
      this.helpful.no = this.helpful.no.filter(id => !id.equals(userId));
    }
  } else {
    if (!this.helpful.no.includes(userId)) {
      this.helpful.no.push(userId);
      this.helpful.yes = this.helpful.yes.filter(id => !id.equals(userId));
    }
  }
  return this.save();
};

reviewSchema.methods.addFlag = function(reason, reportedBy) {
  this.flags.push({
    reason: reason,
    reportedBy: reportedBy,
    reportedAt: new Date()
  });
  return this.save();
};

reviewSchema.methods.approve = function(moderatedBy, notes = '') {
  this.status = 'approved';
  this.moderatedBy = moderatedBy;
  this.moderatedAt = new Date();
  this.moderationNotes = notes;
  return this.save();
};

reviewSchema.methods.reject = function(moderatedBy, notes = '') {
  this.status = 'rejected';
  this.moderatedBy = moderatedBy;
  this.moderatedAt = new Date();
  this.moderationNotes = notes;
  return this.save();
};

reviewSchema.methods.addResponse = function(content, respondedBy) {
  this.response = {
    content: content,
    respondedAt: new Date(),
    respondedBy: respondedBy
  };
  return this.save();
};

// Static methods
reviewSchema.statics.findByTarget = function(targetType, targetId, options = {}) {
  const query = {
    targetType: targetType,
    target: targetId,
    status: 'approved'
  };
  
  if (options.verified) {
    query.verified = true;
  }
  
  return this.find(query)
    .populate('author', 'firstName lastName avatar verified')
    .sort({ createdAt: -1 });
};

reviewSchema.statics.findByAuthor = function(authorId, options = {}) {
  const query = { author: authorId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('target', 'title name')
    .sort({ createdAt: -1 });
};

reviewSchema.statics.findPendingModeration = function() {
  return this.find({
    status: 'pending'
  }).populate('author', 'firstName lastName email');
};

reviewSchema.statics.findFlagged = function() {
  return this.find({
    'flags.status': 'pending'
  }).populate('author', 'firstName lastName email');
};

reviewSchema.statics.getAverageRating = function(targetType, targetId) {
  return this.aggregate([
    {
      $match: {
        targetType: targetType,
        target: mongoose.Types.ObjectId(targetId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$ratings.overall' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate helpful score
  if (this.helpful.yes || this.helpful.no) {
    this.analytics.helpfulScore = this.helpfulScore;
  }
  
  next();
});

module.exports = mongoose.model('Review', reviewSchema);
