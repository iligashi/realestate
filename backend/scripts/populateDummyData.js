const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Property = require('../models/Property');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Favorite = require('../models/Favorite');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Announcement = require('../models/Announcement');
const PlatformSettings = require('../models/PlatformSettings');
const Report = require('../models/Report');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Dummy data arrays
const dummyUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
    userType: 'buyer',
    phone: '+1-555-0101',
    bio: 'Looking for my dream home in the suburbs',
    location: 'New York, NY',
    isVerified: true,
    isBlocked: false
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    userType: 'seller',
    phone: '+1-555-0102',
    bio: 'Selling my beautiful family home',
    location: 'Los Angeles, CA',
    isVerified: true,
    isBlocked: false
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    userType: 'agent',
    phone: '+1-555-0103',
    bio: 'Licensed real estate agent with 10+ years experience',
    location: 'Chicago, IL',
    isVerified: true,
    isBlocked: false,
    agent: {
      company: 'Premier Real Estate',
      licenseNumber: 'RE123456',
      specialties: ['Residential', 'Commercial', 'Luxury']
    }
  },
  {
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    userType: 'renter',
    phone: '+1-555-0104',
    bio: 'Looking for a cozy apartment in the city',
    location: 'Miami, FL',
    isVerified: true,
    isBlocked: false
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@realestate.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    userType: 'admin',
    phone: '+1-555-0000',
    bio: 'Platform administrator',
    location: 'San Francisco, CA',
    isVerified: true,
    isBlocked: false
  }
];

const dummyProperties = [
  {
    title: 'Modern Downtown Apartment',
    description: 'Beautiful 2-bedroom apartment with city views, modern amenities, and convenient location.',
    propertyType: 'apartment',
    listingType: 'sale',
    status: 'active',
    price: 450000,
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-74.006, 40.7128] // [longitude, latitude]
    },
    details: {
      bedrooms: 2,
      bathrooms: 2,
      squareMeters: 120
    },
    features: ['Balcony', 'Gym', 'Pool', 'Parking'],
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
    isFeatured: true,
    featuredAt: new Date(),
    featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    featuredPrice: 29.99
  },
  {
    title: 'Family Home in Suburbs',
    description: 'Spacious 4-bedroom family home with large backyard, perfect for growing families.',
    propertyType: 'house',
    listingType: 'sale',
    status: 'active',
    price: 750000,
    address: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-118.2437, 34.0522] // [longitude, latitude]
    },
    details: {
      bedrooms: 4,
      bathrooms: 3,
      squareMeters: 250
    },
    features: ['Backyard', 'Garage', 'Fireplace', 'Garden'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        caption: 'Exterior View',
        isPrimary: true,
        order: 1
      }
    ],
    isFeatured: false
  },
  {
    title: 'Luxury Penthouse',
    description: 'Exclusive penthouse with panoramic city views, high-end finishes, and premium amenities.',
    propertyType: 'apartment',
    listingType: 'sale',
    status: 'active',
    price: 2500000,
    address: {
      street: '789 Luxury Blvd',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      country: 'USA'
    },
    location: {
      type: 'Point',
      coordinates: [-80.1918, 25.7617] // [longitude, latitude]
    },
    details: {
      bedrooms: 3,
      bathrooms: 4,
      squareMeters: 300
    },
    features: ['Rooftop Terrace', 'Concierge', 'Private Elevator', 'Wine Cellar'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        caption: 'Penthouse View',
        isPrimary: true,
        order: 1
      }
    ],
    isFeatured: true,
    featuredAt: new Date(),
    featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    featuredPrice: 49.99
  }
];

const dummyAnnouncements = [
  {
    title: 'Welcome to Our New Platform!',
    content: 'We\'re excited to launch our modern real estate marketplace. Find your dream home or list your property with confidence.',
    type: 'general',
    priority: 'high',
    isActive: true,
    targetAudience: ['all'],
    isPinned: true
  },
  {
    title: 'New Featured Listing Feature',
    content: 'Premium properties can now be featured for better visibility. Contact our team to learn more about this exciting opportunity.',
    type: 'update',
    priority: 'medium',
    isActive: true,
    targetAudience: ['sellers', 'agents']
  },
  {
    title: 'Holiday Season Special',
    content: 'Get 20% off on all premium features this holiday season. Don\'t miss out on this limited-time offer!',
    type: 'promotion',
    priority: 'medium',
    isActive: true,
    targetAudience: ['all'],
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
];

const dummyReports = [
  {
    type: 'spam',
    reason: 'Repeated promotional content in multiple listings from the same user',
    status: 'pending',
    priority: 'medium',
    evidence: ['Multiple similar listings from same user'],
    metadata: {
      browser: 'Chrome',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  },
  {
    type: 'inappropriate',
    reason: 'Inappropriate content found in property description',
    status: 'resolved',
    priority: 'high',
    evidence: ['Offensive language found in description'],
    adminNotes: 'Content removed, user warned about community guidelines',
    action: 'content_removal',
    resolvedAt: new Date(),
    resolvedBy: null // Will be set when creating
  }
];

const dummyPlatformSettings = {
  general: {
    siteName: 'Real Estate Marketplace',
    siteDescription: 'Your trusted platform for real estate transactions',
    contactEmail: 'contact@realestate.com',
    contactPhone: '+1 (555) 123-4567',
    logo: 'https://via.placeholder.com/200x80?text=RealEstate',
    socialMedia: {
      facebook: 'https://facebook.com/realestate',
      twitter: 'https://twitter.com/realestate',
      linkedin: 'https://linkedin.com/realestate',
      instagram: 'https://instagram.com/realestate'
    }
  },
  appearance: {
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    theme: 'light'
  },
  business: {
    commissionRate: 5.0,
    featuredListingPrice: 29.99,
    premiumFeatures: [
      {
        name: 'Virtual Tour',
        price: 19.99,
        description: '360-degree virtual tour of your property',
        isActive: true
      },
      {
        name: 'Priority Listing',
        price: 39.99,
        description: 'Get your listing featured at the top of search results',
        isActive: true
      },
      {
        name: 'Social Media Promotion',
        price: 49.99,
        description: 'Promote your listing across social media platforms',
        isActive: true
      }
    ],
    currency: 'USD',
    taxRate: 8.5
  },
  features: {
    enableReviews: true,
    enableMessaging: true,
    enableNotifications: true,
    enableAdvancedSearch: true,
    enableVirtualTours: true,
    enableAIChatbot: false,
    maxImagesPerListing: 20,
    maxListingsPerUser: 10
  },
  security: {
    requireEmailVerification: true,
    requirePhoneVerification: false,
    requireIDVerification: false,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
    enableTwoFactorAuth: false
  },
  notifications: {
    emailTemplates: {
      welcome: 'Welcome to our platform!',
      listingApproved: 'Your listing has been approved.',
      listingRejected: 'Your listing has been rejected.',
      newMessage: 'You have a new message.',
      passwordReset: 'Password reset instructions.'
    },
    smsEnabled: false,
    pushNotifications: true
  },
  maintenance: {
    isMaintenanceMode: false,
    maintenanceMessage: '',
    allowedIPs: []
  }
};

// Populate function
const populateDummyData = async () => {
  try {
    console.log('🚀 Starting to populate dummy data...');

    // Clear existing data
    await User.deleteMany({});
    await Property.deleteMany({});
    await Announcement.deleteMany({});
    await PlatformSettings.deleteMany({});
    await Report.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    const createdUsers = await User.insertMany(dummyUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Get admin user for announcements
    const adminUser = createdUsers.find(user => user.userType === 'admin');
    const agentUser = createdUsers.find(user => user.userType === 'agent');

    // Update announcements with createdBy
    const announcementsWithUsers = dummyAnnouncements.map(announcement => ({
      ...announcement,
      createdBy: adminUser._id
    }));

    // Create announcements
    const createdAnnouncements = await Announcement.insertMany(announcementsWithUsers);
    console.log(`✅ Created ${createdAnnouncements.length} announcements`);

    // Update properties with owner
    const propertiesWithOwners = dummyProperties.map((property, index) => ({
      ...property,
      owner: createdUsers[index % createdUsers.length]._id
    }));

    // Create properties
    const createdProperties = await Property.insertMany(propertiesWithOwners);
    console.log(`✅ Created ${createdProperties.length} properties`);

    // Create platform settings
    await PlatformSettings.create(dummyPlatformSettings);
    console.log('✅ Created platform settings');

    // Update reports with createdBy and link to properties
    const reportsWithUsers = dummyReports.map((report, index) => ({
      ...report,
      reportedBy: createdUsers[0]._id,
      reportedItem: createdProperties[index % createdProperties.length]._id,
      reportedItemModel: 'Property',
      resolvedBy: report.status === 'resolved' ? adminUser._id : null
    }));

    // Create reports
    const createdReports = await Report.insertMany(reportsWithUsers);
    console.log(`✅ Created ${createdReports.length} reports`);

    console.log('🎉 All dummy data populated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Properties: ${createdProperties.length}`);
    console.log(`   Announcements: ${createdAnnouncements.length}`);
    console.log(`   Reports: ${createdReports.length}`);
    console.log(`   Platform Settings: 1`);

    // Display admin credentials
    console.log('\n🔑 Admin Login Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: password`);
    console.log(`   User Type: ${adminUser.userType}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating dummy data:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  connectDB().then(() => {
    populateDummyData();
  });
}

module.exports = { populateDummyData };
