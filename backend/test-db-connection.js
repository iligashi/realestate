const { sequelize } = require('./models');
const { User } = require('./models');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔌 Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL || 'mysql://localhost:3306/real_estate_db');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database Connected');
    
    // Check if tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📁 Tables found:', tables);
    
    // Check user count
    const userCount = await User.count();
    console.log(`👥 Users in database: ${userCount}`);
    
    // Check if we can read a user
    if (userCount > 0) {
      const firstUser = await User.findOne({
        attributes: ['email', 'first_name', 'last_name', 'user_type']
      });
      console.log('👤 First user:', firstUser);
    }
    
    // Close connection
    await sequelize.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Run the test
testConnection();