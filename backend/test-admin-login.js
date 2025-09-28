const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./models');
const { sequelize } = require('./config/database');

async function testAdminLogin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    // Get admin user
    const admin = await User.findOne({ where: { email: 'admin@realestate.com' } });
    if (!admin) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Admin user found:', admin.email, admin.userType);
    
    // Test password (assuming it's 'password' or similar)
    const testPasswords = ['password', 'admin', 'admin123', '123456'];
    let validPassword = null;
    
    for (const testPassword of testPasswords) {
      try {
        const isValid = await bcrypt.compare(testPassword, admin.password);
        if (isValid) {
          validPassword = testPassword;
          break;
        }
      } catch (err) {
        // Continue to next password
      }
    }
    
    if (validPassword) {
      console.log('Valid password found:', validPassword);
      
      // Generate token
      const token = jwt.sign(
        { userId: admin.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      console.log('Admin token:', token);
    } else {
      console.log('No valid password found for admin user');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

testAdminLogin();
