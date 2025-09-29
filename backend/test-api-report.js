const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API report endpoint...');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test getting report details
    const reportResponse = await axios.get('http://localhost:5000/api/reports/4', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Report details retrieved successfully:');
    console.log(JSON.stringify(reportResponse.data, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAPI();
