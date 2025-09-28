const { sequelize } = require('./config/database');

async function addSpatialIndex() {
  try {
    console.log('🔄 Adding spatial index...');
    
    // Add spatial index for location field
    await sequelize.query(
      'CREATE SPATIAL INDEX idx_properties_location ON properties (location)'
    );
    
    console.log('✅ Spatial index added successfully');
    
  } catch (error) {
    if (error.message.includes('Duplicate key name')) {
      console.log('ℹ️  Spatial index already exists');
    } else {
      console.error('❌ Error adding spatial index:', error.message);
    }
  } finally {
    await sequelize.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  addSpatialIndex();
}

module.exports = addSpatialIndex;
