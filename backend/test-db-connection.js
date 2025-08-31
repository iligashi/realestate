const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔌 Testing database connection...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-marketplace');
    
    // Connect to database
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-marketplace', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Check if collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections found:', collections.map(c => c.name));
    
    // Check user count
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log(`👥 Users in database: ${userCount}`);
    
    // Check if we can read a user
    if (userCount > 0) {
      const firstUser = await User.findOne().select('email firstName lastName userType');
      console.log('👤 First user:', firstUser);
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
};

testConnection();
