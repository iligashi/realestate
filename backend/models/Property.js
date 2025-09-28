const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 5000]
    }
  },
  propertyType: {
    type: DataTypes.ENUM('house', 'apartment', 'office', 'land', 'commercial'),
    allowNull: false
  },
  listingType: {
    type: DataTypes.ENUM('sale', 'rent', 'rental', 'auction', 'pre-construction'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    validate: {
      isIn: [['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK']]
    }
  },
  rentPeriod: {
    type: DataTypes.ENUM('monthly', 'weekly', 'daily', 'yearly'),
    defaultValue: 'monthly'
  },
  photos: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  address: {
    type: DataTypes.JSON,
    allowNull: false
  },
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true
  },
  details: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  amenities: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending', 'sold', 'rented'),
    defaultValue: 'active'
  },
  availability: {
    type: DataTypes.ENUM('immediate', 'custom', 'negotiable'),
    defaultValue: 'immediate'
  },
  availabilityDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  agentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'properties',
  timestamps: true,
  indexes: [
    {
      fields: ['propertyType']
    },
    {
      fields: ['listingType']
    },
    {
      fields: ['price']
    },
    {
      fields: ['status']
    },
    {
      fields: ['ownerId']
    },
    {
      fields: ['location'],
      using: 'GIST'
    }
  ]
});

// Instance methods
Property.prototype.getFullAddress = function() {
  const addr = this.address;
  if (!addr || typeof addr !== 'object') {
    return '';
  }
  return `${addr.street || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zipCode || ''} ${addr.country || ''}`.trim();
};

Property.prototype.getPricePerSqMeter = function() {
  if (this.details && this.details.squareMeters && this.details.squareMeters > 0) {
    return this.price / this.details.squareMeters;
  }
  return null;
};

Property.prototype.isAvailable = function() {
  return this.status === 'active' && this.availability !== 'custom';
};

// Static methods
Property.findNearby = function(coordinates, maxDistance = 10000) {
  return this.findAll({
    where: sequelize.where(
      sequelize.fn('ST_Distance_Sphere', 
        sequelize.col('location'), 
        sequelize.fn('ST_GeomFromText', `POINT(${coordinates[0]} ${coordinates[1]})`)
      ),
      '<=',
      maxDistance
    )
  });
};

Property.findByPriceRange = function(minPrice, maxPrice) {
  return this.findAll({
    where: {
      price: {
        [sequelize.Op.between]: [minPrice, maxPrice]
      }
    }
  });
};

// Virtual fields (computed properties)
Property.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Parse JSON fields that might be stored as strings
  if (values.photos && typeof values.photos === 'string') {
    try {
      values.photos = JSON.parse(values.photos);
    } catch (e) {
      console.error('Error parsing photos JSON:', e);
      values.photos = [];
    }
  }
  
  if (values.address && typeof values.address === 'string') {
    try {
      values.address = JSON.parse(values.address);
    } catch (e) {
      console.error('Error parsing address JSON:', e);
      values.address = {};
    }
  }
  
  if (values.details && typeof values.details === 'string') {
    try {
      values.details = JSON.parse(values.details);
    } catch (e) {
      console.error('Error parsing details JSON:', e);
      values.details = {};
    }
  }
  
  if (values.features && typeof values.features === 'string') {
    try {
      values.features = JSON.parse(values.features);
    } catch (e) {
      console.error('Error parsing features JSON:', e);
      values.features = [];
    }
  }
  
  if (values.amenities && typeof values.amenities === 'string') {
    try {
      values.amenities = JSON.parse(values.amenities);
    } catch (e) {
      console.error('Error parsing amenities JSON:', e);
      values.amenities = [];
    }
  }
  
  values.fullAddress = this.getFullAddress();
  values.pricePerSqMeter = this.getPricePerSqMeter();
  values.isAvailable = this.isAvailable();
  return values;
};

module.exports = Property;