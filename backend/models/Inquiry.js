const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
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
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Inquiry Details
  type: {
    type: String,
    enum: ['general', 'viewing', 'offer', 'negotiation', 'question'],
    default: 'general'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Contact Information
  contactMethod: {
    type: String,
    enum: ['email', 'phone', 'message'],
    default: 'message'
  },
  preferredContactTime: String,
  
  // Status & Workflow
  status: {
    type: String,
    enum: ['new', 'read', 'responded', 'scheduled', 'completed', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Response Tracking
  responseTime: Number, // in hours
  lastResponse: Date,
  responseCount: { type: Number, default: 0 },
  
  // Scheduling
  scheduledViewing: {
    date: Date,
    time: String,
    duration: Number, // in minutes
    notes: String,
    confirmed: { type: Boolean, default: false }
  },
  
  // Offer Details (if applicable)
  offer: {
    amount: Number,
    currency: String,
    conditions: String,
    validUntil: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered', 'expired'],
      default: 'pending'
    }
  },
  
  // Follow-up
  followUpDate: Date,
  followUpNotes: String,
  
  // Analytics
  readAt: Date,
  respondedAt: Date,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
inquirySchema.index({ property: 1, seller: 1 });
inquirySchema.index({ seller: 1, status: 1 });
inquirySchema.index({ buyer: 1 });
inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ status: 1, priority: 1 });

// Pre-save middleware
inquirySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
inquirySchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

inquirySchema.methods.markAsResponded = function() {
  this.status = 'responded';
  this.respondedAt = new Date();
  this.responseCount += 1;
  return this.save();
};

inquirySchema.methods.scheduleViewing = function(date, time, duration, notes) {
  this.scheduledViewing = {
    date,
    time,
    duration,
    notes,
    confirmed: false
  };
  this.status = 'scheduled';
  return this.save();
};

// Static methods
inquirySchema.statics.getInquiriesBySeller = function(sellerId, status = null) {
  const filter = { seller: sellerId };
  if (status) filter.status = status;
  
  return this.find(filter)
    .populate('property', 'title address price photos')
    .populate('buyer', 'firstName lastName email phone')
    .sort({ createdAt: -1 });
};

inquirySchema.statics.getInquiryStats = function(sellerId) {
  return this.aggregate([
    { $match: { seller: mongoose.Types.ObjectId(sellerId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Inquiry', inquirySchema);
