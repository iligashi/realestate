const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Lead Information
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
  
  // Agent Assignment
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Lead Source and Quality
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'open_house', 'advertisement', 'cold_call', 'sign', 'other'],
    required: true
  },
  sourceDetails: String, // Additional details about the source
  quality: {
    type: String,
    enum: ['hot', 'warm', 'cold'],
    default: 'warm'
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  // Lead Type and Preferences
  leadType: {
    type: String,
    enum: ['buyer', 'seller', 'both', 'investor', 'renter'],
    required: true
  },
  budget: {
    min: Number,
    max: Number
  },
  propertyTypes: [String],
  preferredLocations: [String],
  timeline: {
    type: String,
    enum: ['immediate', '1-3_months', '3-6_months', '6-12_months', 'flexible']
  },
  
  // Status and Progress
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost', 'unqualified'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Communication History
  interactions: [{
    type: {
      type: String,
      enum: ['call', 'email', 'text', 'meeting', 'showing', 'other']
    },
    subject: String,
    notes: String,
    outcome: String,
    date: { type: Date, default: Date.now },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    nextAction: String,
    nextActionDate: Date
  }],
  
  // Follow-up and Nurturing
  followUpSchedule: [{
    type: {
      type: String,
      enum: ['call', 'email', 'text', 'meeting', 'showing']
    },
    scheduledDate: Date,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    },
    notes: String,
    completedDate: Date
  }],
  
  // Conversion Information
  convertedToClient: {
    type: Boolean,
    default: false
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  conversionDate: Date,
  conversionValue: Number, // Estimated deal value
  
  // Lost Lead Information
  lostReason: {
    type: String,
    enum: ['price', 'timing', 'location', 'competitor', 'no_interest', 'unresponsive', 'other']
  },
  lostDetails: String,
  lostDate: Date,
  
  // Tags and Notes
  tags: [String],
  notes: String,
  
  // Important Dates
  firstContact: { type: Date, default: Date.now },
  lastContact: Date,
  nextFollowUp: Date,
  
  // Lead Scoring Factors
  scoringFactors: {
    budgetMatch: { type: Number, default: 0 },
    timelineMatch: { type: Number, default: 0 },
    locationMatch: { type: Number, default: 0 },
    engagementLevel: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }
  },
  
  // Marketing Attribution
  campaignId: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
leadSchema.index({ agentId: 1, status: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ quality: 1, score: -1 });
leadSchema.index({ status: 1, nextFollowUp: 1 });
leadSchema.index({ convertedToClient: 1 });

// Pre-save middleware
leadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update last contact date if there are new interactions
  if (this.interactions && this.interactions.length > 0) {
    const lastInteraction = this.interactions[this.interactions.length - 1];
    this.lastContact = lastInteraction.date;
  }
  
  // Calculate lead score based on various factors
  this.calculateScore();
  
  next();
});

// Instance methods
leadSchema.methods.calculateScore = function() {
  let score = 0;
  const factors = this.scoringFactors || {};
  
  // Budget match (0-25 points)
  score += Math.min(factors.budgetMatch || 0, 25);
  
  // Timeline match (0-20 points)
  score += Math.min(factors.timelineMatch || 0, 20);
  
  // Location match (0-20 points)
  score += Math.min(factors.locationMatch || 0, 20);
  
  // Engagement level (0-20 points)
  score += Math.min(factors.engagementLevel || 0, 20);
  
  // Response time (0-15 points)
  score += Math.min(factors.responseTime || 0, 15);
  
  this.score = Math.min(score, 100);
  
  // Update quality based on score
  if (this.score >= 80) {
    this.quality = 'hot';
  } else if (this.score >= 60) {
    this.quality = 'warm';
  } else {
    this.quality = 'cold';
  }
};

leadSchema.methods.addInteraction = function(interaction) {
  this.interactions.push(interaction);
  this.lastContact = interaction.date;
  
  // Update engagement level based on interaction frequency
  const recentInteractions = this.interactions.filter(
    i => i.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
  );
  this.scoringFactors.engagementLevel = Math.min(recentInteractions.length * 5, 20);
  
  return this.save();
};

leadSchema.methods.convertToClient = function(clientId) {
  this.convertedToClient = true;
  this.clientId = clientId;
  this.conversionDate = new Date();
  this.status = 'converted';
  return this.save();
};

// Virtual fields
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

leadSchema.virtual('isActive').get(function() {
  return ['new', 'contacted', 'qualified', 'nurturing'].includes(this.status);
});

leadSchema.virtual('needsFollowUp').get(function() {
  return this.nextFollowUp && this.nextFollowUp <= new Date();
});

// Static methods
leadSchema.statics.getLeadsByAgent = function(agentId, filters = {}) {
  const query = { agentId, ...filters };
  return this.find(query).sort({ score: -1, createdAt: -1 });
};

leadSchema.statics.getConversionRate = function(agentId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        agentId: mongoose.Types.ObjectId(agentId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        converted: { $sum: { $cond: ['$convertedToClient', 1, 0] } }
      }
    }
  ]);
};

module.exports = mongoose.model('Lead', leadSchema);
