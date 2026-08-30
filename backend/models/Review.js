module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'author_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    targetType: {
      type: DataTypes.ENUM('property', 'agent', 'neighborhood', 'agency'),
      allowNull: false,
      field: 'target_type'
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'target_id'
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // Ratings (stored as JSON)
    ratings: {
      type: DataTypes.JSON,
      allowNull: false
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    },
    verifiedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'verified_by_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
      defaultValue: 'pending'
    },
    moderatedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'moderated_by_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    moderatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'moderated_at'
    },
    moderationNotes: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'moderation_notes'
    },
    // Flags and reports (stored as JSON)
    flags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Helpfulness voting (stored as JSON)
    helpful: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Media attachments (stored as JSON)
    photos: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Review context (stored as JSON)
    context: {
      type: DataTypes.JSON,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Analytics (stored as JSON)
    analytics: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Response from target (stored as JSON)
    response: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'reviews',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['target_type', 'target_id']
      },
      {
        fields: ['author_id', 'created_at']
      },
      {
        fields: ['status', 'created_at']
      },
      {
        fields: ['ratings']
      },
      {
        fields: ['verified']
      },
      {
        fields: ['tags']
      }
    ],
    hooks: {
      beforeSave: (review) => {
        // Calculate helpful score
        const helpful = review.helpful || { yes: [], no: [] };
        if (helpful.yes || helpful.no) {
          const yesCount = helpful.yes.length || 0;
          const noCount = helpful.no.length || 0;
          const total = yesCount + noCount;
          const helpfulScore = total > 0 ? Math.round((yesCount / total) * 100) : 0;
          
          const analytics = review.analytics || {};
          analytics.helpfulScore = helpfulScore;
          review.analytics = analytics;
        }
      }
    }
  });

  // Instance methods
  Review.prototype.getHelpfulScore = function() {
    const helpful = this.helpful || { yes: [], no: [] };
    const yesCount = helpful.yes.length || 0;
    const noCount = helpful.no.length || 0;
    const total = yesCount + noCount;
    return total > 0 ? Math.round((yesCount / total) * 100) : 0;
  };

  Review.prototype.getAverageRating = function() {
    const ratings = this.ratings || {};
    if (this.targetType === 'property' && ratings.property) {
      const propertyRatings = Object.values(ratings.property).filter(r => r);
      return propertyRatings.length > 0 ? 
        propertyRatings.reduce((a, b) => a + b, 0) / propertyRatings.length : 
        ratings.overall;
    }
    return ratings.overall;
  };

  Review.prototype.isVerified = function() {
    return this.verified && this.status === 'approved';
  };

  Review.prototype.hasResponse = function() {
    return this.response && this.response.content;
  };

  Review.prototype.markHelpful = async function(userId, isHelpful) {
    const helpful = this.helpful || { yes: [], no: [] };
    
    if (isHelpful) {
      if (!helpful.yes.includes(userId)) {
        helpful.yes.push(userId);
        helpful.no = helpful.no.filter(id => id !== userId);
      }
    } else {
      if (!helpful.no.includes(userId)) {
        helpful.no.push(userId);
        helpful.yes = helpful.yes.filter(id => id !== userId);
      }
    }
    
    this.helpful = helpful;
    return this.save();
  };

  Review.prototype.addFlag = async function(reason, reportedBy) {
    const flags = this.flags || [];
    flags.push({
      reason: reason,
      reportedBy: reportedBy,
      reportedAt: new Date()
    });
    this.flags = flags;
    return this.save();
  };

  Review.prototype.approve = async function(moderatedBy, notes = '') {
    this.status = 'approved';
    this.moderatedById = moderatedBy;
    this.moderatedAt = new Date();
    this.moderationNotes = notes;
    return this.save();
  };

  Review.prototype.reject = async function(moderatedBy, notes = '') {
    this.status = 'rejected';
    this.moderatedById = moderatedBy;
    this.moderatedAt = new Date();
    this.moderationNotes = notes;
    return this.save();
  };

  Review.prototype.addResponse = async function(content, respondedBy) {
    this.response = {
      content: content,
      respondedAt: new Date(),
      respondedBy: respondedBy
    };
    return this.save();
  };

  // Static methods
  Review.findByTarget = function(targetType, targetId, options = {}) {
    const query = {
      where: {
        targetType: targetType,
        targetId: targetId,
        status: 'approved'
      },
      order: [['created_at', 'DESC']]
    };
    
    if (options.verified) {
      query.where.verified = true;
    }
    
    return this.findAll(query);
  };

  Review.findByAuthor = function(authorId, options = {}) {
    const query = {
      where: { authorId: authorId },
      order: [['created_at', 'DESC']]
    };
    
    if (options.status) {
      query.where.status = options.status;
    }
    
    return this.findAll(query);
  };

  Review.findPendingModeration = function() {
    return this.findAll({
      where: {
        status: 'pending'
      }
    });
  };

  Review.findFlagged = function() {
    return this.findAll({
      where: {
        [sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn('JSON_EXTRACT', sequelize.col('flags'), '$[*].status'),
            'pending'
          )
        ]
      }
    });
  };

  Review.getAverageRating = function(targetType, targetId) {
    return this.findAll({
      where: {
        targetType: targetType,
        targetId: targetId,
        status: 'approved'
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('ratings')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
      ]
    });
  };

  // Virtual fields (computed properties)
  Review.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.helpfulScore = this.getHelpfulScore();
    values.averageRating = this.getAverageRating();
    values.isVerified = this.isVerified();
    values.hasResponse = this.hasResponse();
    return values;
  };

  return Review;
};