module.exports = (sequelize, DataTypes) => {
  const Inquiry = sequelize.define('Inquiry', {
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
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'seller_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'buyer_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('general', 'viewing', 'offer', 'negotiation', 'question'),
      defaultValue: 'general'
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    contactMethod: {
      type: DataTypes.ENUM('email', 'phone', 'message'),
      defaultValue: 'message',
      field: 'contact_method'
    },
    preferredContactTime: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'preferred_contact_time'
    },
    status: {
      type: DataTypes.ENUM('new', 'read', 'responded', 'scheduled', 'completed', 'closed'),
      defaultValue: 'new'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'response_time',
      comment: 'Response time in hours'
    },
    lastResponse: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_response'
    },
    responseCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'response_count'
    },
    // Scheduling (stored as JSON)
    scheduledViewing: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'scheduled_viewing'
    },
    // Offer Details (stored as JSON)
    offer: {
      type: DataTypes.JSON,
      allowNull: true
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'follow_up_date'
    },
    followUpNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'follow_up_notes'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'responded_at'
    }
  }, {
    tableName: 'inquiries',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['property_id', 'seller_id']
      },
      {
        fields: ['seller_id', 'status']
      },
      {
        fields: ['buyer_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['status', 'priority']
      }
    ]
  });

  // Instance methods
  Inquiry.prototype.markAsRead = async function() {
    this.status = 'read';
    this.readAt = new Date();
    return this.save();
  };

  Inquiry.prototype.markAsResponded = async function() {
    this.status = 'responded';
    this.respondedAt = new Date();
    this.responseCount += 1;
    return this.save();
  };

  Inquiry.prototype.scheduleViewing = async function(date, time, duration, notes) {
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
  Inquiry.getInquiriesBySeller = function(sellerId, status = null) {
    const where = { sellerId: sellerId };
    if (status) where.status = status;
    
    return this.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
  };

  Inquiry.getInquiryStats = function(sellerId) {
    return this.findAll({
      where: { sellerId: sellerId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
  };

  return Inquiry;
};