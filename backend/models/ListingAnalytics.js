module.exports = (sequelize, DataTypes) => {
  const ListingAnalytics = sequelize.define('ListingAnalytics', {
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
    // View Analytics (stored as JSON)
    views: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Engagement Metrics (stored as JSON)
    saves: {
      type: DataTypes.JSON,
      allowNull: true
    },
    shares: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Inquiry Analytics (stored as JSON)
    inquiries: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Response Metrics (stored as JSON)
    responseTime: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'response_time'
    },
    // Conversion Metrics (stored as JSON)
    conversion: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Traffic Sources (stored as JSON)
    trafficSources: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'traffic_sources'
    },
    // Device Analytics (stored as JSON)
    devices: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Geographic Analytics (stored as JSON)
    locations: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Time-based Analytics (stored as JSON)
    hourlyViews: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'hourly_views'
    },
    dailyViews: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'daily_views'
    },
    weeklyViews: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'weekly_views'
    },
    monthlyViews: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'monthly_views'
    },
    // Price Change Impact (stored as JSON)
    priceChanges: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'price_changes'
    },
    // Competitor Analysis (stored as JSON)
    competitorData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'competitor_data'
    },
    // Market Trends (stored as JSON)
    marketTrends: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'market_trends'
    },
    // Performance Score (stored as JSON)
    performanceScore: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'performance_score'
    },
    // Recommendations (stored as JSON)
    recommendations: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'listing_analytics',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['property_id', 'seller_id']
      },
      {
        fields: ['seller_id', 'views']
      },
      {
        fields: ['daily_views']
      },
      {
        fields: ['performance_score']
      }
    ]
  });

  // Instance methods
  ListingAnalytics.prototype.recordView = async function(userId = null, source = 'direct', device = 'desktop', location = null) {
    const views = this.views || {
      total: 0,
      unique: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      lastUpdated: new Date()
    };
    
    views.total += 1;
    views.today += 1;
    views.thisWeek += 1;
    views.thisMonth += 1;
    views.lastUpdated = new Date();
    
    this.views = views;
    
    // Update traffic sources
    const trafficSources = this.trafficSources || {};
    if (trafficSources[source] !== undefined) {
      trafficSources[source] += 1;
    }
    this.trafficSources = trafficSources;
    
    // Update device analytics
    const devices = this.devices || {};
    if (devices[device] !== undefined) {
      devices[device] += 1;
    }
    this.devices = devices;
    
    // Update location analytics
    if (location) {
      const locations = this.locations || [];
      const existingLocation = locations.find(loc => 
        loc.city === location.city && loc.state === location.state
      );
      if (existingLocation) {
        existingLocation.views += 1;
      } else {
        locations.push({
          city: location.city,
          state: location.state,
          country: location.country,
          views: 1
        });
      }
      this.locations = locations;
    }
    
    // Update hourly views
    const hourlyViews = this.hourlyViews || [];
    const currentHour = new Date().getHours();
    const hourlyView = hourlyViews.find(hv => hv.hour === currentHour);
    if (hourlyView) {
      hourlyView.views += 1;
    } else {
      hourlyViews.push({ hour: currentHour, views: 1 });
    }
    this.hourlyViews = hourlyViews;
    
    return this.save();
  };

  ListingAnalytics.prototype.recordSave = async function() {
    const saves = this.saves || { total: 0, today: 0, thisWeek: 0, thisMonth: 0 };
    saves.total += 1;
    saves.today += 1;
    saves.thisWeek += 1;
    saves.thisMonth += 1;
    this.saves = saves;
    return this.save();
  };

  ListingAnalytics.prototype.recordInquiry = async function(type = 'general') {
    const inquiries = this.inquiries || {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byType: {
        general: 0,
        viewing: 0,
        offer: 0,
        negotiation: 0
      }
    };
    
    inquiries.total += 1;
    inquiries.today += 1;
    inquiries.thisWeek += 1;
    inquiries.thisMonth += 1;
    
    if (inquiries.byType[type] !== undefined) {
      inquiries.byType[type] += 1;
    }
    
    this.inquiries = inquiries;
    return this.save();
  };

  ListingAnalytics.prototype.recordPriceChange = async function(oldPrice, newPrice, viewsBefore, inquiriesBefore) {
    const priceChange = {
      oldPrice,
      newPrice,
      changeDate: new Date(),
      viewsBefore,
      viewsAfter: this.views?.total || 0,
      inquiriesBefore,
      inquiriesAfter: this.inquiries?.total || 0,
      impact: 'neutral'
    };
    
    // Calculate impact
    const viewsChange = ((this.views?.total || 0) - viewsBefore) / viewsBefore * 100;
    const inquiriesChange = ((this.inquiries?.total || 0) - inquiriesBefore) / inquiriesBefore * 100;
    
    if (viewsChange > 10 && inquiriesChange > 10) {
      priceChange.impact = 'positive';
    } else if (viewsChange < -10 || inquiriesChange < -10) {
      priceChange.impact = 'negative';
    }
    
    const priceChanges = this.priceChanges || [];
    priceChanges.push(priceChange);
    this.priceChanges = priceChanges;
    
    return this.save();
  };

  ListingAnalytics.prototype.calculatePerformanceScore = async function() {
    const views = this.views || { total: 0 };
    const saves = this.saves || { total: 0 };
    const shares = this.shares || { total: 0 };
    const inquiries = this.inquiries || { total: 0 };
    const responseTime = this.responseTime || { average: 0 };
    
    // Calculate overall performance score (0-100)
    const viewsScore = Math.min((views.total / 100) * 25, 25);
    const engagementScore = Math.min(((saves.total + shares.total) / 50) * 25, 25);
    const responseScore = responseTime.average > 0 ? Math.max(25 - (responseTime.average / 24), 0) : 0;
    const conversionScore = Math.min((inquiries.total / 20) * 25, 25);
    
    const overallScore = viewsScore + engagementScore + responseScore + conversionScore;
    
    this.performanceScore = {
      overall: Math.round(overallScore),
      views: Math.round(viewsScore),
      engagement: Math.round(engagementScore),
      response: Math.round(responseScore),
      conversion: Math.round(conversionScore),
      lastCalculated: new Date()
    };
    
    return this.save();
  };

  // Static methods
  ListingAnalytics.getAnalyticsBySeller = function(sellerId, period = '30d') {
    return this.findAll({
      where: { sellerId: sellerId },
      order: [['views', 'DESC']]
    });
  };

  ListingAnalytics.getTopPerformers = function(sellerId, limit = 5) {
    return this.findAll({
      where: { sellerId: sellerId },
      order: [['performance_score', 'DESC']],
      limit: limit
    });
  };

  return ListingAnalytics;
};