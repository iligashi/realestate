'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profile_picture: {
        type: Sequelize.STRING,
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      user_type: {
        type: Sequelize.ENUM('buyer', 'seller', 'renter', 'agent', 'admin'),
        allowNull: false
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verification_badge: {
        type: Sequelize.ENUM('none', 'bronze', 'silver', 'gold', 'platinum'),
        defaultValue: 'none'
      },
      agent: {
        type: Sequelize.JSON,
        allowNull: true
      },
      company: {
        type: Sequelize.STRING,
        allowNull: true
      },
      license_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      specialties: {
        type: Sequelize.JSON,
        allowNull: true
      },
      location: {
        type: Sequelize.JSON,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      social_links: {
        type: Sequelize.JSON,
        allowNull: true
      },
      documents: {
        type: Sequelize.JSON,
        allowNull: true
      },
      notification_settings: {
        type: Sequelize.JSON,
        allowNull: true
      },
      stats: {
        type: Sequelize.JSON,
        allowNull: true
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lock_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create properties table
    await queryInterface.createTable('properties', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      property_type: {
        type: Sequelize.ENUM('house', 'apartment', 'office'),
        allowNull: false
      },
      listing_type: {
        type: Sequelize.ENUM('sale', 'rent', 'rental', 'auction', 'pre-construction'),
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'),
        defaultValue: 'USD'
      },
      price_history: {
        type: Sequelize.JSON,
        allowNull: true
      },
      rent_period: {
        type: Sequelize.ENUM('monthly', 'weekly', 'daily', 'yearly'),
        defaultValue: 'monthly'
      },
      rental_details: {
        type: Sequelize.JSON,
        allowNull: true
      },
      address: {
        type: Sequelize.JSON,
        allowNull: false
      },
      // Use POINT type for location
      location: {
        type: Sequelize.GEOMETRY('POINT'),
        allowNull: false
      },
      map_data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true
      },
      features: {
        type: Sequelize.JSON,
        allowNull: true
      },
      amenities: {
        type: Sequelize.JSON,
        allowNull: true
      },
      appliances: {
        type: Sequelize.JSON,
        allowNull: true
      },
      heating: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cooling: {
        type: Sequelize.STRING,
        allowNull: true
      },
      utilities: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      featured_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      featured_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      featured_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      photos: {
        type: Sequelize.JSON,
        allowNull: true
      },
      videos: {
        type: Sequelize.JSON,
        allowNull: true
      },
      virtual_tours: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'pending', 'sold', 'rented', 'inactive', 'under-contract'),
        defaultValue: 'active'
      },
      availability: {
        type: Sequelize.ENUM('immediate', '30-days', '60-days', '90-days', 'custom'),
        defaultValue: 'immediate'
      },
      available_from: {
        type: Sequelize.DATE,
        allowNull: true
      },
      featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      premium: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      agent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      agency: {
        type: Sequelize.STRING,
        allowNull: true
      },
      property_tax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      hoa_fees: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      hoa_frequency: {
        type: Sequelize.STRING,
        allowNull: true
      },
      insurance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      documents: {
        type: Sequelize.JSON,
        allowNull: true
      },
      neighborhood: {
        type: Sequelize.JSON,
        allowNull: true
      },
      schools: {
        type: Sequelize.JSON,
        allowNull: true
      },
      transportation: {
        type: Sequelize.JSON,
        allowNull: true
      },
      sustainability: {
        type: Sequelize.JSON,
        allowNull: true
      },
      analytics: {
        type: Sequelize.JSON,
        allowNull: true
      },
      seo: {
        type: Sequelize.JSON,
        allowNull: true
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verification_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      verified_by_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      custom_fields: {
        type: Sequelize.JSON,
        allowNull: true
      },
      listed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      last_updated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create announcements table
    await queryInterface.createTable('announcements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('general', 'maintenance', 'update', 'alert', 'promotion'),
        defaultValue: 'general'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      target_audience: {
        type: Sequelize.JSON,
        defaultValue: ['all']
      },
      start_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes (avoiding duplicates)
    try {
      await queryInterface.addIndex('users', ['user_type', 'is_verified']);
    } catch (error) {
      console.log('Index already exists or error:', error.message);
    }

    try {
      await queryInterface.addIndex('properties', ['status', 'featured']);
      await queryInterface.addIndex('properties', ['price']);
      await queryInterface.addIndex('properties', ['property_type', 'listing_type']);
      await queryInterface.addIndex('properties', ['owner_id']);
      await queryInterface.addIndex('properties', ['agent_id']);
      await queryInterface.addIndex('properties', ['verified']);
      await queryInterface.addIndex('properties', ['created_at']);
    } catch (error) {
      console.log('Index creation error:', error.message);
    }

    // Create spatial index for location (MariaDB compatible)
    try {
      await queryInterface.sequelize.query(
        'CREATE SPATIAL INDEX idx_properties_location ON properties (location)'
      );
    } catch (error) {
      console.log('Spatial index creation error:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('announcements');
    await queryInterface.dropTable('properties');
    await queryInterface.dropTable('users');
  }
};