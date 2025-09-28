const { User } = require('./models');

async function testUserRole() {
  try {
    console.log('Testing user role...');
    
    const user = await User.findByPk(14);
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Name: ${user.firstName} ${user.lastName}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- User Type: ${user.userType}`);
    console.log(`- Is Active: ${user.isActive}`);
    console.log(`- Is Blocked: ${user.isBlocked}`);
    
    // Check if user type is seller or admin
    const isSellerOrAdmin = user.userType === 'seller' || user.userType === 'admin';
    console.log(`- Is Seller or Admin: ${isSellerOrAdmin}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing user role:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testUserRole();
