const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification type
  type: {
    type: String,
    enum: [
      'price_change', 'new_listing', 'message_received', 'appointment_confirmed',
      'offer_received', 'property_viewed', 'favorite_updated', 'status_change',
      'verification_approved', 'verification_rejected', 'system_alert',
      'market_update', 'similar_property', 'reminder', 'custom'
    ],
    required: true
  },
  
  // Title and content
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Related entities
  relatedProperty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Notification status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Delivery status
  deliveryStatus: {
    email: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    push: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    sms: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }
  },
  
  // Delivery attempts
  deliveryAttempts: {
    email: { type: Number, default: 0 },
    push: { type: Number, default: 0 },
    sms: { type: Number, default: 0 }
  },
  
  // Delivery timestamps
  deliveredAt: {
    email: Date,
    push: Date,
    sms: Date
  },
  
  // Priority and scheduling
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  scheduledFor: Date,
  expiresAt: Date,
  
  // Action buttons
  actions: [{
    label: String,
    action: String, // 'view', 'reply', 'accept', 'decline', 'custom'
    url: String,
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Template data
  templateData: {
    templateId: String,
    variables: mongoose.Schema.Types.Mixed
  },
  
  // Grouping and threading
  groupId: String, // for grouping related notifications
  threadId: String, // for conversation threads
  
  // User preferences override
  userPreferences: {
    email: Boolean,
    push: Boolean,
    sms: Boolean
  },
  
  // Analytics
  analytics: {
    openedAt: Date,
    clickedAt: Date,
    actionTaken: String,
    timeToOpen: Number, // in seconds
    timeToAction: Number // in seconds
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['system', 'user', 'property', 'message', 'market'],
    default: 'system'
  },
  category: String,
  tags: [String]
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, priority: 1 });
notificationSchema.index({ groupId: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'deliveryStatus.email': 1, 'deliveryStatus.push': 1 });

// Virtual fields
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

notificationSchema.virtual('isScheduled').get(function() {
  return this.scheduledFor && new Date() < this.scheduledFor;
});

notificationSchema.virtual('canDeliver').get(function() {
  return !this.isExpired && !this.isScheduled;
});

notificationSchema.virtual('deliveryChannels').get(function() {
  const channels = [];
  if (this.userPreferences.email !== false) channels.push('email');
  if (this.userPreferences.push !== false) channels.push('push');
  if (this.userPreferences.sms !== false) channels.push('sms');
  return channels;
});

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsDelivered = function(channel) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel] = 'sent';
    this.deliveredAt[channel] = new Date();
  }
  return this.save();
};

notificationSchema.methods.markAsFailed = function(channel) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel] = 'failed';
    this.deliveryAttempts[channel] += 1;
  }
  return this.save();
};

notificationSchema.methods.retryDelivery = function(channel) {
  if (this.deliveryStatus[channel] === 'failed') {
    this.deliveryStatus[channel] = 'pending';
  }
  return this.save();
};

notificationSchema.methods.addAction = function(label, action, url = null, data = null) {
  this.actions.push({
    label,
    action,
    url,
    data
  });
  return this.save();
};

notificationSchema.methods.trackOpen = function() {
  if (!this.analytics.openedAt) {
    this.analytics.openedAt = new Date();
    this.analytics.timeToOpen = Math.floor((this.analytics.openedAt - this.createdAt) / 1000);
  }
  return this.save();
};

notificationSchema.methods.trackAction = function(action) {
  this.analytics.clickedAt = new Date();
  this.analytics.actionTaken = action;
  if (this.analytics.openedAt) {
    this.analytics.timeToAction = Math.floor((this.analytics.clickedAt - this.analytics.openedAt) / 1000);
  }
  return this.save();
};

// Static methods
notificationSchema.statics.findUnread = function(userId) {
  return this.find({
    recipient: userId,
    isRead: false
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.findByType = function(userId, type) {
  return this.find({
    recipient: userId,
    type: type
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.findPendingDelivery = function(channel) {
  return this.find({
    [`deliveryStatus.${channel}`]: 'pending',
    scheduledFor: { $lte: new Date() },
    expiresAt: { $gt: new Date() }
  }).sort({ priority: -1, createdAt: 1 });
};

notificationSchema.statics.findExpired = function() {
  return this.find({
    expiresAt: { $lt: new Date() }
  });
};

notificationSchema.statics.cleanupOld = function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set default expiration if not set
  if (!this.expiresAt) {
    this.expiresAt = new Date();
    this.expiresAt.setDate(this.expiresAt.getDate() + 30); // 30 days default
  }
  
  // Set scheduled time if not set and priority is high/urgent
  if (!this.scheduledFor && ['high', 'urgent'].includes(this.priority)) {
    this.scheduledFor = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
