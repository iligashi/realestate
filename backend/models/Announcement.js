module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define('Announcement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('general', 'maintenance', 'update', 'alert', 'promotion'),
      defaultValue: 'general'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_pinned'
    },
    targetAudience: {
      type: DataTypes.JSON,
      defaultValue: ['all'],
      field: 'target_audience'
    },
    startDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_date'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Metadata (stored as JSON)
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'announcements',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['is_active', 'start_date', 'priority']
      },
      {
        fields: ['target_audience', 'is_active']
      },
      {
        fields: ['type', 'is_active']
      }
    ]
  });

  // Instance methods
  Announcement.prototype.isCurrentlyActive = function() {
    if (!this.isActive) return false;
    const now = new Date();
    if (this.startDate && now < this.startDate) return false;
    if (this.endDate && now > this.endDate) return false;
    return true;
  };

  Announcement.prototype.incrementViews = async function() {
    const metadata = this.metadata || {};
    metadata.views = (metadata.views || 0) + 1;
    this.metadata = metadata;
    return this.save();
  };

  Announcement.prototype.incrementClicks = async function() {
    const metadata = this.metadata || {};
    metadata.clicks = (metadata.clicks || 0) + 1;
    this.metadata = metadata;
    return this.save();
  };

  Announcement.prototype.incrementDismissals = async function() {
    const metadata = this.metadata || {};
    metadata.dismissals = (metadata.dismissals || 0) + 1;
    this.metadata = metadata;
    return this.save();
  };

  // Static methods
  Announcement.getActiveForUser = function(userType) {
    const now = new Date();
    return this.findAll({
      where: {
        isActive: true,
        startDate: {
          [sequelize.Op.lte]: now
        },
        [sequelize.Op.or]: [
          { endDate: null },
          { endDate: { [sequelize.Op.gt]: now } }
        ],
        [sequelize.Op.or]: [
          sequelize.where(
            sequelize.fn('JSON_CONTAINS', sequelize.col('target_audience'), '"all"'),
            true
          ),
          sequelize.where(
            sequelize.fn('JSON_CONTAINS', sequelize.col('target_audience'), `"${userType}"`),
            true
          )
        ]
      },
      order: [
        ['priority', 'DESC'],
        ['is_pinned', 'DESC'],
        ['start_date', 'DESC']
      ]
    });
  };

  // Virtual fields (computed properties)
  Announcement.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.isCurrentlyActive = this.isCurrentlyActive();
    return values;
  };

  return Announcement;
};