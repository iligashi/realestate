const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Agent Relationship
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Client Type and Preferences
  clientType: {
    type: String,
    enum: ['buyer', 'seller', 'both'],
    required: true
  },
  budget: {
    min: Number,
    max: Number
  },
  propertyTypes: [String],
  preferredLocations: [String],
  mustHaveFeatures: [String],
  dealBreakers: [String],
  
  // Timeline and Urgency
  timeline: {
    type: String,
    enum: ['immediate', '1-3_months', '3-6_months', '6-12_months', 'flexible']
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent']
  },
  
  // Communication Preferences
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone', 'text', 'in_person'],
    default: 'email'
  },
  bestTimeToContact: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'anytime']
  },
  
  // Status and Progress
  status: {
    type: String,
    enum: ['lead', 'prospect', 'active', 'under_contract', 'closed', 'inactive'],
    default: 'lead'
  },
  leadSource: {
    type: String,
    enum: ['referral', 'website', 'social_media', 'open_house', 'advertisement', 'cold_call', 'other']
  },
  
  // Transaction Details
  currentProperty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  interestedProperties: [{
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    interestLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    notes: String,
    dateAdded: { type: Date, default: Date.now }
  }],
  
  // Communication History
  communicationHistory: [{
    type: {
      type: String,
      enum: ['call', 'email', 'text', 'meeting', 'showing', 'other']
    },
    subject: String,
    notes: String,
    date: { type: Date, default: Date.now },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Documents and Files
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Financial Information (for pre-approval tracking)
  financialInfo: {
    preApproved: { type: Boolean, default: false },
    preApprovalAmount: Number,
    preApprovalExpiry: Date,
    lender: String,
    downPayment: Number,
    creditScore: Number
  },
  
  // Notes and Tags
  notes: String,
  tags: [String],
  
  // Important Dates
  firstContact: { type: Date, default: Date.now },
  lastContact: Date,
  nextFollowUp: Date,
  
  // Satisfaction and Feedback
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  wouldRecommend: Boolean,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
clientSchema.index({ agentId: 1, status: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ clientType: 1 });
clientSchema.index({ status: 1, lastContact: -1 });

// Pre-save middleware
clientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual fields
clientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

clientSchema.virtual('isActive').get(function() {
  return ['lead', 'prospect', 'active', 'under_contract'].includes(this.status);
});

module.exports = mongoose.model('Client', clientSchema);
