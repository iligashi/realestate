module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reporterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'reporter_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reportedItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'reported_item_id'
    },
    reportedItemModel: {
      type: DataTypes.ENUM('property', 'user', 'message', 'review'),
      allowNull: false,
      field: 'reported_item_type'
    },
    type: {
      type: DataTypes.ENUM('spam', 'inappropriate', 'fraud', 'harassment', 'other'),
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
      defaultValue: 'pending'
    },
    // Evidence/attachments (stored as JSON)
    evidence: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Additional metadata (stored as JSON)
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'reports',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['status', 'created_at']
      },
      {
        fields: ['type', 'status']
      },
      {
        fields: ['reporter_id']
      },
      {
        fields: ['reported_item_id']
      }
    ]
  });

  // Instance methods
  Report.prototype.getAge = function() {
    return Date.now() - this.createdAt;
  };

  Report.prototype.updateStatus = async function(status, adminNotes, action, resolvedById) {
    this.status = status;
    this.adminNotes = adminNotes;
    this.action = action;
    this.resolvedById = resolvedById;
    this.resolvedAt = new Date();
    return this.save();
  };

  // Static methods
  Report.getByStatus = function(status) {
    return this.findAll({
      where: { status }
    });
  };

  Report.getByType = function(type) {
    return this.findAll({
      where: { type }
    });
  };

  // Virtual fields (computed properties)
  Report.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.age = this.getAge();
    return values;
  };

  return Report;
};
