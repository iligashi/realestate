<<<<<<< Updated upstream
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Property being inquired about
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  
  // Buyer (person sending the message) - for sales inquiries
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Seller (property owner) - for sales inquiries
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Renter (person applying for rental) - for rental inquiries
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Landlord (property owner) - for rental inquiries
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Message type to distinguish between sales and rental inquiries
  messageType: {
    type: String,
    enum: ['sale', 'rental'],
    default: 'sale'
  },

  // Rental application reference (if this is a rental message)
  rentalApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalApplication'
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
=======
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'property_id',
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'buyer_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'seller_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    renterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'renter_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    landlordId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'landlord_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    isRead: {
      type: Boolean,
      default: false
=======
    status: {
      type: DataTypes.ENUM('new', 'replied', 'closed'),
      defaultValue: 'new'
    },
    // Read status for each participant (stored as JSON)
    readBy: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'read_by'
<<<<<<< Updated upstream
>>>>>>> Stashed changes
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
    },
    renter: {
      type: Boolean,
      default: false
    },
    landlord: {
      type: Boolean,
      default: false
=======
>>>>>>> Stashed changes
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
messageSchema.index({ property: 1, renter: 1, landlord: 1 });
messageSchema.index({ seller: 1, status: 1, lastMessageAt: -1 });
messageSchema.index({ buyer: 1, lastMessageAt: -1 });
messageSchema.index({ landlord: 1, status: 1, lastMessageAt: -1 });
messageSchema.index({ renter: 1, lastMessageAt: -1 });
messageSchema.index({ messageType: 1 });

// Virtual for unread count
messageSchema.virtual('unreadCount').get(function() {
  return this.thread.filter(msg => !msg.isRead).length;
});

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  if (this.buyer && this.buyer.toString() === userId.toString()) {
    this.readBy.buyer = true;
  } else if (this.seller && this.seller.toString() === userId.toString()) {
    this.readBy.seller = true;
  } else if (this.renter && this.renter.toString() === userId.toString()) {
    this.readBy.renter = true;
  } else if (this.landlord && this.landlord.toString() === userId.toString()) {
    this.readBy.landlord = true;
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
  if (this.buyer && this.buyer.toString() === senderId.toString()) {
    this.readBy.seller = false;
  } else if (this.seller && this.seller.toString() === senderId.toString()) {
    this.readBy.buyer = false;
  } else if (this.renter && this.renter.toString() === senderId.toString()) {
    this.readBy.landlord = false;
  } else if (this.landlord && this.landlord.toString() === senderId.toString()) {
    this.readBy.renter = false;
  }
  
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);