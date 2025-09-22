const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['general', 'maintenance', 'update', 'alert', 'promotion'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  targetAudience: {
    type: [String],
    enum: ['all', 'buyers', 'sellers', 'agents', 'renters'],
    default: ['all']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    dismissals: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for efficient queries
announcementSchema.index({ isActive: 1, startDate: -1, priority: -1 });
announcementSchema.index({ targetAudience: 1, isActive: 1 });
announcementSchema.index({ type: 1, isActive: 1 });

// Virtual for checking if announcement is currently active
announcementSchema.virtual('isCurrentlyActive').get(function() {
  if (!this.isActive) return false;
  const now = new Date();
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
});

// Method to increment view count
announcementSchema.methods.incrementViews = function() {
  this.metadata.views += 1;
  return this.save();
};

// Method to increment click count
announcementSchema.methods.incrementClicks = function() {
  this.metadata.clicks += 1;
  return this.save();
};

// Method to increment dismissal count
announcementSchema.methods.incrementDismissals = function() {
  this.metadata.dismissals += 1;
  return this.save();
};

// Static method to get active announcements for a user type
announcementSchema.statics.getActiveForUser = function(userType) {
  const now = new Date();
  return this.find({
    isActive: true,
    $or: [
      { targetAudience: 'all' },
      { targetAudience: userType }
    ],
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: now } }
    ]
  }).sort({ priority: -1, isPinned: -1, startDate: -1 });
};

module.exports = mongoose.model('Announcement', announcementSchema);
