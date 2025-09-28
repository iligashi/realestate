const { sequelize } = require('./config/database');

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Create database if it doesn't exist
    const config = require('./config/config.json');
    const dbName = config.development.database;
    
    try {
      await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`✅ Database '${dbName}' created or already exists`);
    } catch (error) {
      console.log('ℹ️  Database creation skipped:', error.message);
    }
    
    // Sync database (create tables)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables synchronized');
    
    console.log('🎉 Database setup completed successfully!');
    console.log('📊 You can now start your server with: npm start');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('💡 Make sure MySQL/MariaDB is running in XAMPP');
    console.error('💡 Check your database credentials in config/config.json');
  } finally {
    await sequelize.close();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;