module.exports = (sequelize, DataTypes) => {
  const Property = sequelize.define('Property', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    propertyType: {
      type: DataTypes.ENUM('house', 'apartment', 'office'),
      allowNull: false,
      field: 'property_type'
    },
    listingType: {
      type: DataTypes.ENUM('sale', 'rent', 'rental', 'auction', 'pre-construction'),
      allowNull: false,
      field: 'listing_type'
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'),
      defaultValue: 'USD'
    },
    priceHistory: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'price_history'
    },
    rentPeriod: {
      type: DataTypes.ENUM('monthly', 'weekly', 'daily', 'yearly'),
      defaultValue: 'monthly',
      field: 'rent_period'
    },
    // Rental-specific details (stored as JSON)
    rentalDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'rental_details'
    },
    // Address (stored as JSON for flexibility)
    address: {
      type: DataTypes.JSON,
      allowNull: false
    },
    // Geospatial location using MySQL POINT type
    location: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: false
    },
    mapData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'map_data'
    },
    // Property details (stored as JSON)
    details: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Features & Amenities
    features: {
      type: DataTypes.JSON,
      allowNull: true
    },
    amenities: {
      type: DataTypes.JSON,
      allowNull: true
    },
    appliances: {
      type: DataTypes.JSON,
      allowNull: true
    },
    heating: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cooling: {
      type: DataTypes.STRING,
      allowNull: true
    },
    utilities: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Featured Listing
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured'
    },
    featuredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'featured_at'
    },
    featuredUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'featured_until'
    },
    featuredPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'featured_price'
    },
    // Media (stored as JSON arrays)
    photos: {
      type: DataTypes.JSON,
      allowNull: true
    },
    videos: {
      type: DataTypes.JSON,
      allowNull: true
    },
    virtualTours: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'virtual_tours'
    },
    // Status & Availability
    status: {
      type: DataTypes.ENUM('active', 'pending', 'sold', 'rented', 'inactive', 'under-contract'),
      defaultValue: 'active'
    },
    availability: {
      type: DataTypes.ENUM('immediate', '30-days', '60-days', '90-days', 'custom'),
      defaultValue: 'immediate'
    },
    availableFrom: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'available_from'
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Ownership & Agent
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'owner_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    agentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'agent_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    agency: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Financial & Legal
    propertyTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'property_tax'
    },
    hoaFees: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'hoa_fees'
    },
    hoaFrequency: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'hoa_frequency'
    },
    insurance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Neighborhood & School Info (stored as JSON)
    neighborhood: {
      type: DataTypes.JSON,
      allowNull: true
    },
    schools: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Transportation (stored as JSON)
    transportation: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Sustainability & Energy (stored as JSON)
    sustainability: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Analytics & Performance (stored as JSON)
    analytics: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // SEO & Marketing (stored as JSON)
    seo: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Verification & Trust
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verification_date'
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
    // Custom Fields (stored as JSON)
    customFields: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'custom_fields'
    },
    // Timestamps
    listedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'listed_at'
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_updated'
    }
  }, {
    tableName: 'properties',
    timestamps: true,
    underscored: true,
    indexes: [
      // Temporarily removed complex indexes to avoid key length issues
      // Will add them back after basic setup works
    ],
    hooks: {
      beforeSave: (property) => {
        property.lastUpdated = new Date();
      }
    }
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
        values.features = {};
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

  return Property;
};
