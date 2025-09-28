const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  propertyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Properties',
      key: 'id'
    }
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  renterId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  landlordId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  replies: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('open', 'closed', 'resolved'),
    defaultValue: 'open'
  },
  readBy: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    {
      fields: ['propertyId']
    },
    {
      fields: ['buyerId']
    },
    {
      fields: ['sellerId']
    },
    {
      fields: ['renterId']
    },
    {
      fields: ['landlordId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['lastMessageAt']
    }
  ]
});

// Instance methods
Message.prototype.addReply = async function(senderId, message) {
  const replies = this.replies || [];
  replies.push({
    sender: senderId,
    message: message,
    timestamp: new Date()
  });
  this.replies = replies;
  this.lastMessageAt = new Date();
  this.readBy = [senderId]; // Reset read status
  return this.save();
};

Message.prototype.markAsRead = async function(userId) {
  const readBy = this.readBy || [];
  if (!readBy.includes(userId)) {
    readBy.push(userId);
    this.readBy = readBy;
    return this.save();
  }
  return this;
};

Message.prototype.close = async function() {
  this.status = 'closed';
  return this.save();
};

// Static methods
Message.findByUser = function(userId, role) {
  let whereClause = {};
  
  if (role === 'buyer') {
    whereClause.buyerId = userId;
  } else if (role === 'seller') {
    whereClause.sellerId = userId;
  } else if (role === 'renter') {
    whereClause.renterId = userId;
  } else if (role === 'landlord') {
    whereClause.landlordId = userId;
  } else {
    // Get all messages where user is involved
    whereClause = {
      [sequelize.Op.or]: [
        { buyerId: userId },
        { sellerId: userId },
        { renterId: userId },
        { landlordId: userId }
      ]
    };
  }
  
  return this.findAll({
    where: whereClause,
    include: [
      {
        model: sequelize.models.Property,
        as: 'property',
        attributes: ['id', 'title', 'price', 'address', 'photos']
      },
      {
        model: sequelize.models.User,
        as: 'buyer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: sequelize.models.User,
        as: 'seller',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: sequelize.models.User,
        as: 'renter',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: sequelize.models.User,
        as: 'landlord',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ],
    order: [['lastMessageAt', 'DESC']]
  });
};

Message.findByProperty = function(propertyId) {
  return this.findAll({
    where: { propertyId: propertyId },
    include: [
      {
        model: sequelize.models.User,
        as: 'buyer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: sequelize.models.User,
        as: 'seller',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: sequelize.models.User,
        as: 'renter',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: sequelize.models.User,
        as: 'landlord',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ],
    order: [['lastMessageAt', 'DESC']]
  });
};

module.exports = Message;