const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Participants
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Property context
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  
  // Conversation metadata
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['buyer_seller', 'buyer_agent', 'renter_landlord', 'general', 'support'],
    default: 'general'
  },
  
  // Last message info
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  },
  
  // Unread counts per user
  unreadCounts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  
  // Conversation status
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked', 'closed'],
    default: 'active'
  },
  
  // Muting preferences
  mutedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Pinned messages
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  
  // Conversation settings
  settings: {
    allowImages: { type: Boolean, default: true },
    allowFiles: { type: Boolean, default: true },
    autoArchive: { type: Boolean, default: false },
    archiveAfter: { type: Number, default: 30 } // days
  },
  
  // Metadata
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  
  // Tags for organization
  tags: [String],
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Conversation analytics
  analytics: {
    totalMessages: { type: Number, default: 0 },
    averageResponseTime: Number, // in hours
    lastActivity: Date,
    participantsCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ property: 1 });
conversationSchema.index({ status: 1, updatedAt: -1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });
conversationSchema.index({ type: 1, status: 1 });

// Virtual fields
conversationSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

conversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Instance methods
conversationSchema.methods.addParticipant = function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    this.unreadCounts.push({ userId, count: 0 });
    this.analytics.participantsCount = this.participants.length;
  }
  return this.save();
};

conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => !p.equals(userId));
  this.unreadCounts = this.unreadCounts.filter(u => !u.userId.equals(userId));
  this.analytics.participantsCount = this.participants.length;
  return this.save();
};

conversationSchema.methods.updateUnreadCount = function(userId, increment = 1) {
  const unreadEntry = this.unreadCounts.find(u => u.userId.equals(userId));
  if (unreadEntry) {
    unreadEntry.count = Math.max(0, unreadEntry.count + increment);
  } else {
    this.unreadCounts.push({ userId, count: increment });
  }
  return this.save();
};

conversationSchema.methods.markAsRead = function(userId) {
  const unreadEntry = this.unreadCounts.find(u => u.userId.equals(userId));
  if (unreadEntry) {
    unreadEntry.count = 0;
  }
  return this.save();
};

conversationSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = {
    content: message.content,
    sender: message.sender,
    timestamp: message.sentAt
  };
  this.analytics.lastActivity = new Date();
  this.analytics.totalMessages += 1;
  return this.save();
};

conversationSchema.methods.toggleMute = function(userId) {
  const isMuted = this.mutedBy.some(id => id.equals(userId));
  if (isMuted) {
    this.mutedBy = this.mutedBy.filter(id => !id.equals(userId));
  } else {
    this.mutedBy.push(userId);
  }
  return this.save();
};

// Static methods
conversationSchema.statics.findByParticipants = function(userIds) {
  return this.findOne({
    participants: { $all: userIds, $size: userIds.length }
  });
};

conversationSchema.statics.findUserConversations = function(userId, options = {}) {
  const query = {
    participants: userId,
    status: options.status || 'active'
  };
  
  if (options.property) {
    query.property = options.property;
  }
  
  return this.find(query)
    .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 })
    .populate('participants', 'firstName lastName avatar userType')
    .populate('property', 'title photos address price')
    .populate('lastMessage.sender', 'firstName lastName');
};

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  if (this.isNew) {
    this.analytics.participantsCount = this.participants.length;
  }
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
