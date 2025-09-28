const { Sequelize } = require('sequelize');
const config = require('./config.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: dbConfig.define,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+00:00' // UTC
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ MySQL Connected: ${dbConfig.host}/${dbConfig.database}`);
    
    // For now, just authenticate - tables will be created manually
    console.log('🔄 Database connection established - tables will be created separately');
    
  } catch (error) {
    console.error('❌ MySQL connection error:', error.message);
    console.log('⚠️  Server will start without database connection');
    console.log('💡 To fix: Install MySQL or update database configuration');
    
    // In production, you might want to exit here
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await sequelize.close();
  console.log('🔄 MySQL connection closed through app termination');
  process.exit(0);
});

module.exports = { sequelize, connectDB };
