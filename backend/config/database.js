const { Sequelize } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'real_estate_marketplace',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Test the connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully');
    
    // Sync models (create tables if they don't exist)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized');
    }
    
    // Handle connection events
    sequelize.connectionManager.on('disconnect', () => {
      console.log('⚠️  MySQL disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await sequelize.close();
      console.log('🔄 MySQL connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MySQL connection error:', error.message);
    console.log('⚠️  Server will start without database connection');
    console.log('💡 To fix: Install MySQL or update database credentials in .env file');
    
    // In production, you might want to exit here
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };