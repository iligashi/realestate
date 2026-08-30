module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'recipient_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'price_change', 'new_listing', 'message_received', 'appointment_confirmed',
        'offer_received', 'property_viewed', 'favorite_updated', 'status_change',
        'verification_approved', 'verification_rejected', 'system_alert',
        'market_update', 'similar_property', 'reminder', 'custom'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    content: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    relatedPropertyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_property_id',
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    relatedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    relatedMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_message_id',
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    // Delivery status (stored as JSON)
    deliveryStatus: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'delivery_status'
    },
    // Delivery attempts (stored as JSON)
    deliveryAttempts: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'delivery_attempts'
    },
    // Delivery timestamps (stored as JSON)
    deliveredAt: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'delivered_at'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_for'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    },
    // Action buttons (stored as JSON)
    actions: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Template data (stored as JSON)
    templateData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'template_data'
    },
    // Grouping and threading
    groupId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'group_id'
    },
    threadId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'thread_id'
    },
    // User preferences override (stored as JSON)
    userPreferences: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'user_preferences'
    },
    // Analytics (stored as JSON)
    analytics: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Metadata
    source: {
      type: DataTypes.ENUM('system', 'user', 'property', 'message', 'market'),
      defaultValue: 'system'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['recipient_id', 'created_at']
      },
      {
        fields: ['recipient_id', 'is_read']
      },
      {
        fields: ['type', 'created_at']
      },
      {
        fields: ['scheduled_for', 'priority']
      },
      {
        fields: ['group_id']
      },
      {
        fields: ['expires_at']
      }
    ],
    hooks: {
      beforeCreate: (notification) => {
        // Set default expiration if not set
        if (!notification.expiresAt) {
          notification.expiresAt = new Date();
          notification.expiresAt.setDate(notification.expiresAt.getDate() + 30); // 30 days default
        }
        
        // Set scheduled time if not set and priority is high/urgent
        if (!notification.scheduledFor && ['high', 'urgent'].includes(notification.priority)) {
          notification.scheduledFor = new Date();
        }
      }
    }
  });

  // Instance methods
  Notification.prototype.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  };

  Notification.prototype.isScheduled = function() {
    return this.scheduledFor && new Date() < this.scheduledFor;
  };

  Notification.prototype.canDeliver = function() {
    return !this.isExpired() && !this.isScheduled();
  };

  Notification.prototype.getDeliveryChannels = function() {
    const preferences = this.userPreferences || {};
    const channels = [];
    if (preferences.email !== false) channels.push('email');
    if (preferences.push !== false) channels.push('push');
    if (preferences.sms !== false) channels.push('sms');
    return channels;
  };

  Notification.prototype.markAsRead = async function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  };

  Notification.prototype.markAsDelivered = async function(channel) {
    const deliveryStatus = this.deliveryStatus || {};
    const deliveredAt = this.deliveredAt || {};
    
    if (deliveryStatus[channel]) {
      deliveryStatus[channel] = 'sent';
      deliveredAt[channel] = new Date();
      this.deliveryStatus = deliveryStatus;
      this.deliveredAt = deliveredAt;
    }
    
    return this.save();
  };

  Notification.prototype.markAsFailed = async function(channel) {
    const deliveryStatus = this.deliveryStatus || {};
    const deliveryAttempts = this.deliveryAttempts || {};
    
    if (deliveryStatus[channel]) {
      deliveryStatus[channel] = 'failed';
      deliveryAttempts[channel] = (deliveryAttempts[channel] || 0) + 1;
      this.deliveryStatus = deliveryStatus;
      this.deliveryAttempts = deliveryAttempts;
    }
    
    return this.save();
  };

  Notification.prototype.retryDelivery = async function(channel) {
    const deliveryStatus = this.deliveryStatus || {};
    if (deliveryStatus[channel] === 'failed') {
      deliveryStatus[channel] = 'pending';
      this.deliveryStatus = deliveryStatus;
    }
    return this.save();
  };

  Notification.prototype.addAction = async function(label, action, url = null, data = null) {
    const actions = this.actions || [];
    actions.push({
      label,
      action,
      url,
      data
    });
    this.actions = actions;
    return this.save();
  };

  Notification.prototype.trackOpen = async function() {
    const analytics = this.analytics || {};
    if (!analytics.openedAt) {
      analytics.openedAt = new Date();
      analytics.timeToOpen = Math.floor((analytics.openedAt - this.createdAt) / 1000);
      this.analytics = analytics;
    }
    return this.save();
  };

  Notification.prototype.trackAction = async function(action) {
    const analytics = this.analytics || {};
    analytics.clickedAt = new Date();
    analytics.actionTaken = action;
    if (analytics.openedAt) {
      analytics.timeToAction = Math.floor((analytics.clickedAt - analytics.openedAt) / 1000);
    }
    this.analytics = analytics;
    return this.save();
  };

  // Static methods
  Notification.findUnread = function(userId) {
    return this.findAll({
      where: {
        recipientId: userId,
        isRead: false
      },
      order: [['created_at', 'DESC']]
    });
  };

  Notification.findByType = function(userId, type) {
    return this.findAll({
      where: {
        recipientId: userId,
        type: type
      },
      order: [['created_at', 'DESC']]
    });
  };

  Notification.findPendingDelivery = function(channel) {
    return this.findAll({
      where: {
        [sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn('JSON_EXTRACT', sequelize.col('delivery_status'), `$.${channel}`),
            'pending'
          ),
          { scheduledFor: { [sequelize.Op.lte]: new Date() } },
          { expiresAt: { [sequelize.Op.gt]: new Date() } }
        ]
      },
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });
  };

  Notification.findExpired = function() {
    return this.findAll({
      where: {
        expiresAt: { [sequelize.Op.lt]: new Date() }
      }
    });
  };

  Notification.cleanupOld = function(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return this.destroy({
      where: {
        createdAt: { [sequelize.Op.lt]: cutoffDate },
        isRead: true
      }
    });
  };

  // Virtual fields (computed properties)
  Notification.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.isExpired = this.isExpired();
    values.isScheduled = this.isScheduled();
    values.canDeliver = this.canDeliver();
    values.deliveryChannels = this.getDeliveryChannels();
    return values;
  };

  return Notification;
};