module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define('Favorite', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
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
    savedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'saved_at'
    },
    notes: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    // Alert settings (stored as JSON)
    alerts: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Price tracking (stored as JSON)
    priceTracking: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'price_tracking'
    },
    // Viewing history (stored as JSON)
    viewHistory: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'view_history'
    },
    // Comparison data (stored as JSON)
    comparisonData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'comparison_data'
    },
    // Sharing settings (stored as JSON)
    sharing: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Reminder settings (stored as JSON)
    reminders: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Analytics (stored as JSON)
    analytics: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'favorites',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'property_id'],
        unique: true
      },
      {
        fields: ['user_id', 'saved_at']
      },
      {
        fields: ['property_id']
      },
      {
        fields: ['tags']
      }
    ],
    hooks: {
      beforeCreate: (favorite) => {
        if (!favorite.priceTracking) {
          favorite.priceTracking = {
            originalPrice: null,
            currentPrice: null,
            priceHistory: [],
            lastChecked: null
          };
        }
      }
    }
  });

  // Instance methods
  Favorite.prototype.isPriceIncreased = function() {
    const tracking = this.priceTracking || {};
    if (tracking.originalPrice && tracking.currentPrice) {
      return tracking.currentPrice > tracking.originalPrice;
    }
    return false;
  };

  Favorite.prototype.getPriceChangePercentage = function() {
    const tracking = this.priceTracking || {};
    if (tracking.originalPrice && tracking.currentPrice) {
      return ((tracking.currentPrice - tracking.originalPrice) / tracking.originalPrice) * 100;
    }
    return 0;
  };

  Favorite.prototype.getDaysSinceSaved = function() {
    const now = new Date();
    const diffTime = Math.abs(now - this.savedAt);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  Favorite.prototype.updatePrice = async function(newPrice) {
    const tracking = this.priceTracking || {};
    const oldPrice = tracking.currentPrice || tracking.originalPrice;
    
    if (oldPrice && newPrice !== oldPrice) {
      const change = newPrice - oldPrice;
      const percentageChange = (change / oldPrice) * 100;
      
      const priceHistory = tracking.priceHistory || [];
      priceHistory.push({
        price: newPrice,
        date: new Date(),
        change: change,
        percentageChange: percentageChange
      });
      
      // Keep only last 10 price changes
      if (priceHistory.length > 10) {
        priceHistory.splice(0, priceHistory.length - 10);
      }
      
      this.priceTracking = {
        ...tracking,
        currentPrice: newPrice,
        lastChecked: new Date(),
        priceHistory: priceHistory
      };
    }
    
    return this.save();
  };

  Favorite.prototype.addView = async function(duration = 0) {
    const viewHistory = this.viewHistory || [];
    viewHistory.push({
      date: new Date(),
      duration: duration
    });
    
    // Keep only last 50 views
    if (viewHistory.length > 50) {
      viewHistory.splice(0, viewHistory.length - 50);
    }
    
    const analytics = this.analytics || {};
    analytics.timesViewed = (analytics.timesViewed || 0) + 1;
    analytics.lastViewed = new Date();
    analytics.totalViewTime = (analytics.totalViewTime || 0) + duration;
    
    this.viewHistory = viewHistory;
    this.analytics = analytics;
    
    return this.save();
  };

  Favorite.prototype.addReminder = async function(type, date, message = '') {
    const reminders = this.reminders || [];
    reminders.push({
      type: type,
      date: date,
      message: message
    });
    
    this.reminders = reminders;
    return this.save();
  };

  Favorite.prototype.completeReminder = async function(reminderId) {
    const reminders = this.reminders || [];
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (reminder) {
      reminder.isCompleted = true;
      reminder.completedAt = new Date();
      this.reminders = reminders;
    }
    
    return this.save();
  };

  Favorite.prototype.shareWithUser = async function(userId, canEdit = false) {
    const sharing = this.sharing || { isShared: false, sharedWith: [] };
    
    if (!sharing.sharedWith.some(share => share.userId === userId)) {
      sharing.sharedWith.push({
        userId: userId,
        sharedAt: new Date(),
        canEdit: canEdit
      });
      sharing.isShared = true;
      this.sharing = sharing;
    }
    
    return this.save();
  };

  Favorite.prototype.removeSharedUser = async function(userId) {
    const sharing = this.sharing || { isShared: false, sharedWith: [] };
    sharing.sharedWith = sharing.sharedWith.filter(share => share.userId !== userId);
    sharing.isShared = sharing.sharedWith.length > 0;
    this.sharing = sharing;
    
    return this.save();
  };

  // Static methods
  Favorite.findUserFavorites = function(userId, options = {}) {
    const query = {
      where: { userId: userId },
      order: [['saved_at', 'DESC']]
    };
    
    if (options.tags && options.tags.length > 0) {
      query.where[sequelize.Op.or] = options.tags.map(tag => 
        sequelize.where(
          sequelize.fn('JSON_CONTAINS', sequelize.col('tags'), `"${tag}"`),
          true
        )
      );
    }
    
    if (options.priority) {
      query.where.priority = options.priority;
    }
    
    return this.findAll(query);
  };

  Favorite.findPriceAlerts = function() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return this.findAll({
      where: {
        [sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn('JSON_EXTRACT', sequelize.col('alerts'), '$.priceChanges'),
            true
          ),
          sequelize.where(
            sequelize.fn('JSON_EXTRACT', sequelize.col('price_tracking'), '$.lastChecked'),
            { [sequelize.Op.lt]: yesterday }
          )
        ]
      }
    });
  };

  // Virtual fields (computed properties)
  Favorite.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.isPriceIncreased = this.isPriceIncreased();
    values.priceChangePercentage = this.getPriceChangePercentage();
    values.daysSinceSaved = this.getDaysSinceSaved();
    return values;
  };

  return Favorite;
};