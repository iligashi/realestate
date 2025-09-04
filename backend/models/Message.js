const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Property being inquired about
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  
  // Buyer (person sending the message)
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Seller (property owner)
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Message content
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Message thread (for replies)
  thread: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Status tracking
  status: {
    type: String,
    enum: ['new', 'replied', 'closed'],
    default: 'new'
  },
  
  // Read status for each participant
  readBy: {
    buyer: {
      type: Boolean,
      default: false
    },
    seller: {
      type: Boolean,
      default: false
    }
  },
  
  // Timestamps
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ property: 1, buyer: 1, seller: 1 });
messageSchema.index({ seller: 1, status: 1, lastMessageAt: -1 });
messageSchema.index({ buyer: 1, lastMessageAt: -1 });

// Virtual for unread count
messageSchema.virtual('unreadCount').get(function() {
  return this.thread.filter(msg => !msg.isRead).length;
});

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  if (this.buyer.toString() === userId.toString()) {
    this.readBy.buyer = true;
  } else if (this.seller.toString() === userId.toString()) {
    this.readBy.seller = true;
    // Mark all thread messages as read
    this.thread.forEach(msg => {
      msg.isRead = true;
    });
  }
  return this.save();
};

// Method to add reply
messageSchema.methods.addReply = function(senderId, message) {
  this.thread.push({
    sender: senderId,
    message: message,
    sentAt: new Date(),
    isRead: false
  });
  
  // Update status and last message time
  this.status = 'replied';
  this.lastMessageAt = new Date();
  
  // Mark as unread for the recipient
  if (this.buyer.toString() === senderId.toString()) {
    this.readBy.seller = false;
  } else {
    this.readBy.buyer = false;
  }
  
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);