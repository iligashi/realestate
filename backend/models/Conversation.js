module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'property_id',
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('buyer_seller', 'buyer_agent', 'renter_landlord', 'general', 'support'),
      defaultValue: 'general'
    },
    // Last message info (stored as JSON)
    lastMessage: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'last_message'
    },
    // Unread counts per user (stored as JSON)
    unreadCounts: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'unread_counts'
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'blocked', 'closed'),
      defaultValue: 'active'
    },
    // Muting preferences (stored as JSON)
    mutedBy: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'muted_by'
    },
    // Pinned messages (stored as JSON)
    pinnedMessages: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'pinned_messages'
    },
    // Conversation settings (stored as JSON)
    settings: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Metadata
    startedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'started_by_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'started_at'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    // Conversation analytics (stored as JSON)
    analytics: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['property_id']
      },
      {
        fields: ['status', 'updated_at']
      },
      {
        fields: ['type', 'status']
      }
    ]
  });

  // Instance methods
  Conversation.prototype.isActive = function() {
    return this.status === 'active';
  };

  Conversation.prototype.getParticipantCount = function() {
    return this.participants ? this.participants.length : 0;
  };

  Conversation.prototype.addParticipant = async function(userId) {
    const participants = this.participants || [];
    if (!participants.includes(userId)) {
      participants.push(userId);
      this.participants = participants;
      
      const unreadCounts = this.unreadCounts || [];
      unreadCounts.push({ userId, count: 0 });
      this.unreadCounts = unreadCounts;
      
      const analytics = this.analytics || {};
      analytics.participantsCount = participants.length;
      this.analytics = analytics;
    }
    return this.save();
  };

  Conversation.prototype.removeParticipant = async function(userId) {
    const participants = (this.participants || []).filter(p => p !== userId);
    this.participants = participants;
    
    const unreadCounts = (this.unreadCounts || []).filter(u => u.userId !== userId);
    this.unreadCounts = unreadCounts;
    
    const analytics = this.analytics || {};
    analytics.participantsCount = participants.length;
    this.analytics = analytics;
    
    return this.save();
  };

  Conversation.prototype.updateUnreadCount = async function(userId, increment = 1) {
    const unreadCounts = this.unreadCounts || [];
    const unreadEntry = unreadCounts.find(u => u.userId === userId);
    
    if (unreadEntry) {
      unreadEntry.count = Math.max(0, unreadEntry.count + increment);
    } else {
      unreadCounts.push({ userId, count: increment });
    }
    
    this.unreadCounts = unreadCounts;
    return this.save();
  };

  Conversation.prototype.markAsRead = async function(userId) {
    const unreadCounts = this.unreadCounts || [];
    const unreadEntry = unreadCounts.find(u => u.userId === userId);
    
    if (unreadEntry) {
      unreadEntry.count = 0;
      this.unreadCounts = unreadCounts;
    }
    
    return this.save();
  };

  Conversation.prototype.updateLastMessage = async function(message) {
    this.lastMessage = {
      content: message.content,
      sender: message.sender,
      timestamp: message.sentAt
    };
    
    const analytics = this.analytics || {};
    analytics.lastActivity = new Date();
    analytics.totalMessages = (analytics.totalMessages || 0) + 1;
    this.analytics = analytics;
    
    return this.save();
  };

  Conversation.prototype.toggleMute = async function(userId) {
    const mutedBy = this.mutedBy || [];
    const isMuted = mutedBy.includes(userId);
    
    if (isMuted) {
      this.mutedBy = mutedBy.filter(id => id !== userId);
    } else {
      this.mutedBy = [...mutedBy, userId];
    }
    
    return this.save();
  };

  // Static methods
  Conversation.findByParticipants = function(userIds) {
    return this.findOne({
      where: sequelize.where(
        sequelize.fn('JSON_CONTAINS', sequelize.col('participants'), JSON.stringify(userIds)),
        true
      )
    });
  };

  Conversation.findUserConversations = function(userId, options = {}) {
    const query = {
      where: {
        [sequelize.Op.or]: [
          sequelize.where(
            sequelize.fn('JSON_CONTAINS', sequelize.col('participants'), `"${userId}"`),
            true
          )
        ],
        status: options.status || 'active'
      },
      order: [
        ['last_message', 'DESC'],
        ['updated_at', 'DESC']
      ]
    };
    
    if (options.property) {
      query.where.propertyId = options.property;
    }
    
    return this.findAll(query);
  };

  // Virtual fields (computed properties)
  Conversation.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.isActive = this.isActive();
    values.participantCount = this.getParticipantCount();
    return values;
  };

  return Conversation;
};