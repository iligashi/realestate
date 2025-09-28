<<<<<<< Updated upstream
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Who reported
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // What was reported (property, user, etc.)
  reportedItem: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'reportedItemModel',
    required: true
  },
  
  // The model type of the reported item
  reportedItemModel: {
    type: String,
    required: true,
    enum: ['Property', 'User', 'Message']
  },
  
  // Report type
  type: {
    type: String,
    required: true,
    enum: [
      'spam',
      'inappropriate',
      'fake',
      'harassment',
      'copyright',
      'fraud',
      'other'
=======
module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reportedById: {
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
>>>>>>> Stashed changes
    ]
  },
  
  // Report reason/description
  reason: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  
  // Report status
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'resolved', 'dismissed']
  },
  
  // Admin notes when resolving
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  
  // Action taken by admin
  action: {
    type: String,
    enum: [
      'warning',
      'suspension',
      'ban',
      'content_removal',
      'no_action',
      'other'
    ]
  },
  
  // Resolution details
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Priority level
  priority: {
    type: String,
    default: 'medium',
    enum: ['low', 'medium', 'high', 'urgent']
  },
  
  // Evidence/attachments
  evidence: [{
    type: String, // URLs to screenshots, etc.
    maxlength: 500
  }],
  
  // Additional metadata
  metadata: {
    browser: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ reportedItem: 1 });

// Virtual for report age
reportSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Method to update status
reportSchema.methods.updateStatus = function(status, adminNotes, action, resolvedBy) {
  this.status = status;
  this.adminNotes = adminNotes;
  this.action = action;
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  return this.save();
};

// Static method to get reports by status
reportSchema.statics.getByStatus = function(status) {
  return this.find({ status }).populate('reportedBy', 'firstName lastName email');
};

// Static method to get reports by type
reportSchema.statics.getByType = function(type) {
  return this.find({ type }).populate('reportedBy', 'firstName lastName email');
};

<<<<<<< Updated upstream
module.exports = mongoose.model('Report', reportSchema);
=======


  return Report;
};
>>>>>>> Stashed changes
