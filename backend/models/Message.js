const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Conversation participants
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Property context (if message is about a specific property)
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  
  // Message content
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'property_inquiry', 'appointment_request', 'offer', 'counter_offer'],
    default: 'text'
  },
  
  // Media attachments
  attachments: [{
    type: String, // 'image', 'document', 'video'
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }],
  
  // Message metadata
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Reply context
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Thread information
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  
  // Message flags
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  originalContent: String,
  
  // System messages
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  systemMessageType: {
    type: String,
    enum: ['property_viewed', 'price_change', 'status_change', 'appointment_confirmed', 'offer_received']
  },
  
  // Timestamps
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: Date,
  readAt: Date
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ participants: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ property: 1 });
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ 'readBy.userId': 1 });

// Virtual fields
messageSchema.virtual('isUnread').get(function() {
  return !this.isRead;
});

messageSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInMinutes = Math.floor((now - this.sentAt) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
});

// Instance methods
messageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.userId.equals(userId))) {
    this.readBy.push({
      userId: userId,
      readAt: new Date()
    });
    this.isRead = true;
    this.readAt = new Date();
  }
  return this.save();
};

messageSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Pre-save middleware
messageSchema.pre('save', function(next) {
  if (this.isModified('content') && this.isNew) {
    this.originalContent = this.content;
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
