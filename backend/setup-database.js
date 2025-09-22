const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Property = require('./models/Property');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const Favorite = require('./models/Favorite');
const Notification = require('./models/Notification');
const Payment = require('./models/Payment');
const Appointment = require('./models/Appointment');
const Review = require('./models/Review');
const Announcement = require('./models/Announcement');
const PlatformSettings = require('./models/PlatformSettings');
const Report = require('./models/Report');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-marketplace', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create indexes for all collections
const createIndexes = async () => {
  console.log('🔧 Creating database indexes...');
  
  try {
    // User indexes
    await User.createIndexes();
    console.log('✅ User indexes created');
    
    // Property indexes
    await Property.createIndexes();
    console.log('✅ Property indexes created');
    
    // Message indexes
    await Message.createIndexes();
    console.log('✅ Message indexes created');
    
    // Conversation indexes
    await Conversation.createIndexes();
    console.log('✅ Conversation indexes created');
    
    // Favorite indexes
    await Favorite.createIndexes();
    console.log('✅ Favorite indexes created');
    
    // Notification indexes
    await Notification.createIndexes();
    console.log('✅ Notification indexes created');
    
    // Payment indexes
    await Payment.createIndexes();
    console.log('✅ Payment indexes created');
    
    // Appointment indexes
    await Appointment.createIndexes();
    console.log('✅ Appointment indexes created');
    
    // Review indexes
    await Review.createIndexes();
    console.log('✅ Review indexes created');
    
    // Announcement indexes
    await Announcement.createIndexes();
    console.log('✅ Announcement indexes created');
    
    // PlatformSettings indexes
    await PlatformSettings.createIndexes();
    console.log('✅ PlatformSettings indexes created');
    
    // Report indexes
    await Report.createIndexes();
    console.log('✅ Report indexes created');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
};

// Create sample data for testing
const createSampleData = async () => {
  console.log('📝 Creating sample data...');
  
  try {
    // Check if sample data already exists
    const userCount = await User.countDocuments();
    const propertyCount = await Property.countDocuments();
    
    if (userCount > 0 && propertyCount > 0) {
      console.log('ℹ️ Sample data already exists, skipping...');
      return;
    }
    
    if (userCount > 0) {
      console.log('ℹ️ Users already exist, skipping user creation...');
    }
    
    if (propertyCount > 0) {
      console.log('ℹ️ Properties already exist, skipping property creation...');
    }
    
    // Create sample admin user
    let adminUser;
    if (userCount === 0) {
      adminUser = new User({
        email: 'admin@realestate.com',
        password: 'admin123456',
        firstName: 'Admin',
        lastName: 'User',
        userType: 'admin',
        isVerified: true,
        verificationBadge: 'platinum',
        phone: '+1234567890',
        location: {
          city: 'New York',
          state: 'NY',
          country: 'USA',
          coordinates: [-74.006, 40.7128]
        }
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    } else {
      adminUser = await User.findOne({ email: 'admin@realestate.com' });
      if (!adminUser) {
        console.log('⚠️ Admin user not found, creating new one...');
        adminUser = new User({
          email: 'admin@realestate.com',
          password: 'admin123456',
          firstName: 'Admin',
          lastName: 'User',
          userType: 'admin',
          isVerified: true,
          verificationBadge: 'platinum',
          phone: '+1234567890',
          location: {
            city: 'New York',
            state: 'NY',
            country: 'USA',
            coordinates: [-74.006, 40.7128]
          }
        });
        await adminUser.save();
        console.log('✅ Admin user created');
      } else {
        console.log('ℹ️ Admin user already exists');
      }
    }
    
    // Create sample agent user
    let agentUser;
    if (userCount === 0) {
      agentUser = new User({
        email: 'agent@realestate.com',
        password: 'agent123456',
        firstName: 'John',
        lastName: 'Smith',
        userType: 'agent',
        isVerified: true,
        verificationBadge: 'gold',
        phone: '+1234567891',
        agent: {
          licenseNumber: 'AG123456',
          agency: 'Smith Real Estate',
          experience: 8,
          specializations: ['residential', 'luxury'],
          languages: ['English', 'Spanish'],
          responseTime: 2,
          rating: { average: 4.8, count: 45 }
        },
        location: {
          city: 'New York',
          state: 'NY',
          country: 'USA',
          coordinates: [-74.006, 40.7128]
        }
      });
      await agentUser.save();
      console.log('✅ Agent user created');
    } else {
      agentUser = await User.findOne({ email: 'agent@realestate.com' });
      if (!agentUser) {
        console.log('⚠️ Agent user not found, creating new one...');
        agentUser = new User({
          email: 'agent@realestate.com',
          password: 'agent123456',
          firstName: 'John',
          lastName: 'Smith',
          userType: 'agent',
          isVerified: true,
          verificationBadge: 'gold',
          phone: '+1234567891',
          agent: {
            licenseNumber: 'AG123456',
            agency: 'Smith Real Estate',
            experience: 8,
            specializations: ['residential', 'luxury'],
            languages: ['English', 'Spanish'],
            responseTime: 2,
            rating: { average: 4.8, count: 45 }
          },
          location: {
            city: 'New York',
            state: 'NY',
            country: 'USA',
            coordinates: [-74.006, 40.7128]
          }
        });
        await agentUser.save();
        console.log('✅ Agent user created');
      } else {
        console.log('ℹ️ Agent user already exists');
      }
    }
    
    // Create sample buyer user
    let buyerUser;
    if (userCount === 0) {
      buyerUser = new User({
        email: 'buyer@realestate.com',
        password: 'buyer123456',
        firstName: 'Jane',
        lastName: 'Doe',
        userType: 'buyer',
        isVerified: true,
        verificationBadge: 'silver',
        phone: '+1234567892',
        preferences: {
          propertyTypes: ['house', 'apartment'],
          priceRange: { min: 200000, max: 800000 },
          locations: ['Manhattan', 'Brooklyn'],
          amenities: ['parking', 'gym', 'pool']
        },
        location: {
          city: 'New York',
          state: 'NY',
          country: 'USA',
          coordinates: [-74.006, 40.7128]
        }
      });
      await buyerUser.save();
      console.log('✅ Buyer user created');
    } else {
      buyerUser = await User.findOne({ email: 'buyer@realestate.com' });
      if (!buyerUser) {
        console.log('⚠️ Buyer user not found, creating new one...');
        buyerUser = new User({
          email: 'buyer@realestate.com',
          password: 'buyer123456',
          firstName: 'Jane',
          lastName: 'Doe',
          userType: 'buyer',
          isVerified: true,
          verificationBadge: 'silver',
          phone: '+1234567892',
          preferences: {
            propertyTypes: ['house', 'apartment'],
            priceRange: { min: 200000, max: 800000 },
            locations: ['Manhattan', 'Brooklyn'],
            amenities: ['parking', 'gym', 'pool']
          },
          location: {
            city: 'New York',
            state: 'NY',
            country: 'USA',
            coordinates: [-74.006, 40.7128]
          }
        });
        await buyerUser.save();
        console.log('✅ Buyer user created');
      } else {
        console.log('ℹ️ Buyer user already exists');
      }
    }
    
    // Create sample property
    if (propertyCount === 0) {
      const sampleProperty = new Property({
        title: 'Luxury 3-Bedroom Apartment in Manhattan',
      description: 'Beautiful luxury apartment with stunning city views, modern amenities, and prime location in the heart of Manhattan.',
      propertyType: 'apartment',
      listingType: 'sale',
      price: 1250000,
      currency: 'USD',
      address: {
        street: '123 Park Avenue',
        city: 'New York',
        state: 'NY',
        zipCode: '10022',
        country: 'USA',
        neighborhood: 'Midtown East'
      },
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128]
      },
      details: {
        bedrooms: 3,
        bathrooms: 2,
        halfBathrooms: 1,
        totalRooms: 6,
        squareMeters: 150,
        squareFeet: 1615,
        yearBuilt: 2015,
        floors: 25,
        parkingSpaces: 1
      },
      features: ['Balcony', 'City View', 'Hardwood Floors', 'Walk-in Closet'],
      amenities: ['Gym', 'Pool', 'Doorman', 'Concierge', 'Parking'],
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          caption: 'Living Room',
          isPrimary: true,
          order: 1
        },
        {
          url: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800',
          caption: 'Kitchen',
          isPrimary: false,
          order: 2
        }
      ],
      owner: adminUser._id,
      agent: agentUser._id,
      featured: true,
      premium: true,
      neighborhood: {
        walkScore: 95,
        transitScore: 98,
        bikeScore: 85,
        crimeRate: 'Low',
        demographics: {
          population: 150000,
          medianAge: 35,
          medianIncome: 120000
        }
      },
      sustainability: {
        energyRating: 'A',
        solarPotential: 'High',
        greenScore: 85,
        energyEfficient: true,
        renewableEnergy: ['Solar Panels']
      }
      });
      await sampleProperty.save();
      console.log('✅ Sample property created');
      
      // Create sample review
      const sampleReview = new Review({
        author: buyerUser._id,
        targetType: 'property',
        target: sampleProperty._id,
        title: 'Amazing apartment in perfect location!',
        content: 'This apartment exceeded all our expectations. The location is perfect, the amenities are top-notch, and the views are breathtaking. Highly recommend!',
        ratings: {
          overall: 5,
          property: {
            cleanliness: 5,
            maintenance: 5,
            value: 5,
            location: 5,
            amenities: 5
          }
        },
        verified: true,
        status: 'approved',
        tags: ['luxury', 'manhattan', 'modern']
      });
      await sampleReview.save();
      console.log('✅ Sample review created');
    } else {
      console.log('ℹ️ Properties already exist, skipping property creation...');
    }
    
    // Create sample platform settings
    const settingsCount = await PlatformSettings.countDocuments();
    if (settingsCount === 0) {
      const platformSettings = new PlatformSettings({
        general: {
          siteName: 'Real Estate Marketplace',
          siteDescription: 'Your trusted platform for real estate transactions',
          contactEmail: 'contact@realestate.com',
          contactPhone: '+1 (555) 123-4567'
        },
        business: {
          commissionRate: 5.0,
          featuredListingPrice: 29.99
        }
      });
      await platformSettings.save();
      console.log('✅ Platform settings created');
    } else {
      console.log('ℹ️ Platform settings already exist');
    }
    
    // Create sample announcements
    const announcementCount = await Announcement.countDocuments();
    if (announcementCount === 0) {
      const sampleAnnouncement = new Announcement({
        title: 'Welcome to Our Platform!',
        content: 'We\'re excited to launch our new real estate marketplace. Find your dream home or list your property with confidence.',
        type: 'general',
        priority: 'medium',
        isActive: true,
        targetAudience: ['all'],
        createdBy: adminUser._id
      });
      await sampleAnnouncement.save();
      console.log('✅ Sample announcement created');
    } else {
      console.log('ℹ️ Announcements already exist');
    }
    
    console.log('🎉 Sample data creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

// Main setup function
const setupDatabase = async () => {
  try {
    await connectDB();
    await createIndexes();
    await createSampleData();
    
    console.log('🚀 Database setup completed successfully!');
    console.log('\n📊 Database Collections:');
    console.log('├── Users (with roles: admin, agent, buyer, seller, renter)');
    console.log('├── Properties (with rich media and analytics)');
    console.log('├── Messages (real-time communication)');
    console.log('├── Conversations (chat thread management)');
    console.log('├── Favorites (user saved properties)');
    console.log('├── Notifications (multi-channel alerts)');
    console.log('├── Payments (with escrow and dispute handling)');
    console.log('├── Appointments (property viewings)');
    console.log('├── Reviews (property, agent, neighborhood ratings)');
    console.log('├── Announcements (platform-wide notifications)');
    console.log('├── PlatformSettings (site configuration)');
    console.log('└── Reports (content moderation)');
    
    console.log('\n🔑 Sample Login Credentials:');
    console.log('├── Admin: admin@realestate.com / admin123456');
    console.log('├── Agent: agent@realestate.com / agent123456');
    console.log('└── Buyer: buyer@realestate.com / buyer123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase, connectDB };
