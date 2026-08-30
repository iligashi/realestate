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
    messageType: {
      type: DataTypes.ENUM('sale', 'rental'),
      defaultValue: 'sale',
      field: 'message_type'
    },
    rentalApplicationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'rental_application_id',
      references: {
        model: 'rental_applications',
        key: 'id'
      }
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // Message thread (stored as JSON)
    thread: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('new', 'replied', 'closed'),
      defaultValue: 'new'
    },
    // Read status for each participant (stored as JSON)
    readBy: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'read_by'
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_message_at'
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['property_id', 'buyer_id', 'seller_id']
      },
      {
        fields: ['property_id', 'renter_id', 'landlord_id']
      },
      {
        fields: ['seller_id', 'status', 'last_message_at']
      },
      {
        fields: ['buyer_id', 'last_message_at']
      },
      {
        fields: ['landlord_id', 'status', 'last_message_at']
      },
      {
        fields: ['renter_id', 'last_message_at']
      },
      {
        fields: ['message_type']
      }
    ]
  });

  // Instance methods
  Message.prototype.getUnreadCount = function() {
    const thread = this.thread || [];
    return thread.filter(msg => !msg.isRead).length;
  };

  Message.prototype.markAsRead = async function(userId) {
    const readBy = this.readBy || {};
    
    if (this.buyerId && this.buyerId.toString() === userId.toString()) {
      readBy.buyer = true;
    } else if (this.sellerId && this.sellerId.toString() === userId.toString()) {
      readBy.seller = true;
    } else if (this.renterId && this.renterId.toString() === userId.toString()) {
      readBy.renter = true;
    } else if (this.landlordId && this.landlordId.toString() === userId.toString()) {
      readBy.landlord = true;
      // Mark all thread messages as read
      const thread = this.thread || [];
      thread.forEach(msg => {
        msg.isRead = true;
      });
      this.thread = thread;
    }
    
    this.readBy = readBy;
    return this.save();
  };

  Message.prototype.addReply = async function(senderId, message) {
    const thread = this.thread || [];
    thread.push({
      sender: senderId,
      message: message,
      sentAt: new Date(),
      isRead: false
    });
    
    this.thread = thread;
    this.status = 'replied';
    this.lastMessageAt = new Date();
    
    // Mark as unread for the recipient
    const readBy = this.readBy || {};
    if (this.buyerId && this.buyerId.toString() === senderId.toString()) {
      readBy.seller = false;
    } else if (this.sellerId && this.sellerId.toString() === senderId.toString()) {
      readBy.buyer = false;
    } else if (this.renterId && this.renterId.toString() === senderId.toString()) {
      readBy.landlord = false;
    } else if (this.landlordId && this.landlordId.toString() === senderId.toString()) {
      readBy.renter = false;
    }
    
    this.readBy = readBy;
    return this.save();
  };

  // Virtual fields (computed properties)
  Message.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.unreadCount = this.getUnreadCount();
    return values;
  };

  return Message;
};