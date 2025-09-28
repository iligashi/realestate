'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create appointments table
    await queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      requester_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      host_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      property_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'properties', key: 'id' }
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('viewing', 'inspection', 'meeting', 'open_house', 'virtual_tour', 'closing'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show'),
        defaultValue: 'pending'
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

    // Create favorites table
    await queryInterface.createTable('favorites', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      property_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'properties', key: 'id' }
      },
      saved_at: {
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

    // Create notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      content: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Create messages table
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      property_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'properties', key: 'id' }
      },
      buyer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      subject: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('new', 'replied', 'closed'),
        defaultValue: 'new'
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

    // Create inquiries table
    await queryInterface.createTable('inquiries', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      property_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'properties', key: 'id' }
      },
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      buyer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      type: {
        type: Sequelize.ENUM('general', 'viewing', 'offer', 'negotiation', 'question'),
        defaultValue: 'general'
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('new', 'read', 'responded', 'scheduled', 'completed', 'closed'),
        defaultValue: 'new'
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

    // Create indexes
    try {
      await queryInterface.addIndex('appointments', ['requester_id', 'start_time']);
      await queryInterface.addIndex('appointments', ['host_id', 'start_time']);
      await queryInterface.addIndex('appointments', ['property_id', 'start_time']);
      await queryInterface.addIndex('appointments', ['status', 'start_time']);
    } catch (error) {
      console.log('Appointment index creation error:', error.message);
    }

    try {
      await queryInterface.addIndex('favorites', ['user_id', 'property_id'], { unique: true });
      await queryInterface.addIndex('favorites', ['user_id', 'saved_at']);
    } catch (error) {
      console.log('Favorite index creation error:', error.message);
    }

    try {
      await queryInterface.addIndex('notifications', ['recipient_id', 'created_at']);
      await queryInterface.addIndex('notifications', ['recipient_id', 'is_read']);
    } catch (error) {
      console.log('Notification index creation error:', error.message);
    }

    try {
      await queryInterface.addIndex('messages', ['property_id', 'buyer_id', 'seller_id']);
      await queryInterface.addIndex('messages', ['seller_id', 'status']);
    } catch (error) {
      console.log('Message index creation error:', error.message);
    }

    try {
      await queryInterface.addIndex('inquiries', ['property_id', 'seller_id']);
      await queryInterface.addIndex('inquiries', ['seller_id', 'status']);
    } catch (error) {
      console.log('Inquiry index creation error:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inquiries');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('favorites');
    await queryInterface.dropTable('appointments');
  }
};