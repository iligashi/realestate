const { Property, Inquiry, OpenHouse, ListingAnalytics, User, sequelize } = require('./models');
const { Op } = require('sequelize');

async function testCompleteResponse() {
  try {
    console.log('Testing complete seller dashboard response...');
    
    const sellerId = 14;
    
    // Get seller's properties with basic stats
    const properties = await Property.findAll({
      where: { ownerId: sellerId },
      attributes: ['id', 'title', 'address', 'price', 'status', 'photos', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate workflow status for each property
    const propertiesWithWorkflow = properties.map(property => {
      let workflowStage = 'List';
      if (property.status === 'active') {
        workflowStage = 'Market';
      } else if (property.status === 'under-contract') {
        workflowStage = 'Negotiate';
      } else if (property.status === 'sold') {
        workflowStage = 'Close';
      }
      
      return {
        ...property.toJSON(),
        workflowStage,
        daysOnMarket: Math.floor((new Date() - property.createdAt) / (1000 * 60 * 60 * 24))
      };
    });
    
    console.log('Properties with workflow:');
    console.log('Count:', propertiesWithWorkflow.length);
    if (propertiesWithWorkflow.length > 0) {
      console.log('First property ID:', propertiesWithWorkflow[0].id);
      console.log('First property keys:', Object.keys(propertiesWithWorkflow[0]));
    }
    
    // Create the complete response
    const response = {
      dashboard: {
        properties: propertiesWithWorkflow,
        stats: {
          totalProperties: properties.length,
          activeProperties: properties.filter(p => p.status === 'active').length,
          totalViews: 0,
          totalInquiries: 0,
          totalSaves: 0,
          avgResponseTime: 0,
          upcomingOpenHouses: 0
        },
        inquiryStats: {},
        recentActivity: []
      }
    };
    
    console.log('Complete response structure:');
    console.log('Properties in response:', response.dashboard.properties.length);
    if (response.dashboard.properties.length > 0) {
      console.log('First property in response ID:', response.dashboard.properties[0].id);
    }
    
    // Test JSON serialization
    const jsonString = JSON.stringify(response);
    const parsedResponse = JSON.parse(jsonString);
    
    console.log('After JSON serialization:');
    console.log('Properties count:', parsedResponse.dashboard.properties.length);
    if (parsedResponse.dashboard.properties.length > 0) {
      console.log('First property ID after JSON:', parsedResponse.dashboard.properties[0].id);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testCompleteResponse();
