const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const Inquiry = require('../models/Inquiry');
const ListingAnalytics = require('../models/ListingAnalytics');
const OpenHouse = require('../models/OpenHouse');
require('dotenv').config();

const seedSellerData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-marketplace');
    console.log('Connected to MongoDB');

    // Find or create a seller user
    let seller = await User.findOne({ userType: 'seller' });
    if (!seller) {
      seller = new User({
        firstName: 'John',
        lastName: 'Seller',
        email: 'seller@example.com',
        password: 'password123', // This should be hashed in real app
        userType: 'seller',
        phone: '+1234567890',
        isActive: true,
        isVerified: true
      });
      await seller.save();
      console.log('Created seller user');
    }

    // Create sample properties
    const properties = [];
    for (let i = 1; i <= 3; i++) {
      const property = new Property({
        title: `Beautiful ${i === 1 ? '3-Bedroom' : i === 2 ? '2-Bedroom' : '4-Bedroom'} Home`,
        description: `This is a stunning ${i === 1 ? '3-bedroom' : i === 2 ? '2-bedroom' : '4-bedroom'} property with modern amenities and great location.`,
        price: 250000 + (i * 50000),
        propertyType: i === 1 ? 'house' : i === 2 ? 'apartment' : 'house',
        listingType: 'sale',
        bedrooms: i === 1 ? 3 : i === 2 ? 2 : 4,
        bathrooms: i === 1 ? 2 : i === 2 ? 1 : 3,
        squareFeet: 1500 + (i * 500),
        address: {
          street: `${100 + i} Main Street`,
          city: 'Sample City',
          state: 'CA',
          zipCode: '90210',
          country: 'US'
        },
        location: {
          type: 'Point',
          coordinates: [-118.2437 + (i * 0.01), 34.0522 + (i * 0.01)] // Los Angeles area with slight variations
        },
        owner: seller._id,
        status: 'active',
        photos: [
          {
            url: `https://via.placeholder.com/800x600?text=Property+${i}+Photo+1`,
            caption: `Property ${i} - Main View`,
            isPrimary: true
          },
          {
            url: `https://via.placeholder.com/800x600?text=Property+${i}+Photo+2`,
            caption: `Property ${i} - Interior`,
            isPrimary: false
          }
        ],
        amenities: ['parking', 'garden', 'balcony'],
        features: ['modern kitchen', 'hardwood floors', 'central air'],
        yearBuilt: 2010 + i,
        lotSize: 0.25 + (i * 0.1),
        parking: i === 1 ? 'garage' : 'street',
        heating: 'central',
        cooling: 'central',
        utilities: ['electricity', 'water', 'gas'],
        petFriendly: true,
        furnished: false,
        availableDate: new Date(),
        leaseTerms: 'monthly',
        deposit: 1000 + (i * 500),
        applicationFee: 50,
        moveInCosts: 2000 + (i * 1000),
        nearbyAmenities: ['school', 'hospital', 'shopping'],
        commute: {
          downtown: 15 + i,
          airport: 30 + i,
          train: 10 + i
        },
        virtualTour: `https://example.com/tour/property-${i}`,
        floorPlan: `https://example.com/floorplan/property-${i}`,
        neighborhood: {
          name: 'Sample Neighborhood',
          description: 'A great neighborhood with excellent amenities',
          walkScore: 80 + i,
          transitScore: 70 + i,
          bikeScore: 60 + i
        },
        analytics: {
          views: 50 + (i * 25),
          saves: 5 + i,
          inquiries: 3 + i,
          shares: 2 + i,
          lastViewed: new Date()
        },
        priceHistory: [
          {
            price: 250000 + (i * 50000),
            date: new Date(),
            reason: 'Initial listing',
            changeType: 'listing'
          }
        ],
        workflowStage: 'market',
        listingDate: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)), // i weeks ago
        lastUpdated: new Date()
      });
      await property.save();
      properties.push(property);
      console.log(`Created property ${i}`);
    }

    // Create sample inquiries
    for (let i = 1; i <= 5; i++) {
      const inquiry = new Inquiry({
        property: properties[i % 3]._id,
        seller: seller._id,
        buyer: seller._id, // Using seller as buyer for demo
        type: ['general', 'viewing', 'offer', 'negotiation', 'question'][i % 5],
        subject: `Inquiry about ${properties[i % 3].title}`,
        message: `I'm interested in this property. Can you provide more information about ${i === 1 ? 'the neighborhood' : i === 2 ? 'the parking situation' : i === 3 ? 'the utilities' : i === 4 ? 'the move-in process' : 'the price'}.`,
        contactMethod: 'email',
        preferredContactTime: 'evening',
        status: ['new', 'read', 'responded', 'scheduled', 'completed'][i % 5],
        priority: ['low', 'medium', 'high', 'urgent'][i % 4],
        responseTime: 2 + (i * 0.5),
        responseCount: i % 3,
        readAt: i > 1 ? new Date(Date.now() - (i * 2 * 60 * 60 * 1000)) : null,
        respondedAt: i > 2 ? new Date(Date.now() - (i * 1 * 60 * 60 * 1000)) : null,
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) // i days ago
      });
      await inquiry.save();
      console.log(`Created inquiry ${i}`);
    }

    // Create sample analytics
    for (let i = 0; i < properties.length; i++) {
      const analytics = new ListingAnalytics({
        property: properties[i]._id,
        seller: seller._id,
        views: {
          total: 50 + (i * 25),
          unique: 30 + (i * 15),
          today: 2 + i,
          thisWeek: 10 + (i * 5),
          thisMonth: 40 + (i * 20),
          lastUpdated: new Date()
        },
        saves: {
          total: 5 + i,
          today: 1,
          thisWeek: 2 + i,
          thisMonth: 4 + i
        },
        shares: {
          total: 2 + i,
          email: 1,
          social: 1 + i,
          direct: 0
        },
        inquiries: {
          total: 3 + i,
          today: 0,
          thisWeek: 1 + i,
          thisMonth: 2 + i,
          byType: {
            general: 1 + i,
            viewing: 1,
            offer: i,
            negotiation: 1
          }
        },
        responseTime: {
          average: 2 + (i * 0.5),
          median: 1.5 + (i * 0.3),
          best: 0.5,
          worst: 8 + i
        },
        conversion: {
          viewsToInquiries: 6 + (i * 2),
          inquiriesToShowings: 50 + (i * 10),
          showingsToOffers: 20 + (i * 5),
          offersToClose: 10 + (i * 2)
        },
        trafficSources: {
          direct: 20 + (i * 5),
          search: 15 + (i * 3),
          social: 8 + i,
          referral: 5 + i,
          email: 2 + i,
          paid: 0
        },
        devices: {
          desktop: 30 + (i * 10),
          mobile: 15 + (i * 5),
          tablet: 5 + i
        },
        performanceScore: {
          overall: 70 + (i * 10),
          views: 18 + (i * 2),
          engagement: 15 + (i * 3),
          response: 20 + (i * 2),
          conversion: 17 + (i * 3),
          lastCalculated: new Date()
        },
        recommendations: [
          {
            type: 'price',
            priority: 'medium',
            title: 'Consider price adjustment',
            description: 'Your property is priced slightly above market average',
            impact: 'Could increase views by 15-20%',
            action: 'Reduce price by 5-10% or add value-added features'
          },
          {
            type: 'photos',
            priority: 'high',
            title: 'Add more interior photos',
            description: 'Only 2 photos may not showcase the property well',
            impact: 'Could increase engagement by 25%',
            action: 'Add 3-5 more high-quality interior photos'
          }
        ]
      });
      await analytics.save();
      console.log(`Created analytics for property ${i + 1}`);
    }

    // Create sample open houses
    for (let i = 1; i <= 2; i++) {
      const openHouse = new OpenHouse({
        property: properties[i - 1]._id,
        seller: seller._id,
        title: `Open House - ${properties[i - 1].title}`,
        description: `Come visit this beautiful property during our open house. Refreshments will be provided.`,
        type: 'open-house',
        startDate: new Date(Date.now() + (i * 7 * 24 * 60 * 60 * 1000)), // i weeks from now
        endDate: new Date(Date.now() + (i * 7 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)), // 2 hours later
        maxAttendees: 20,
        status: 'scheduled',
        isPublic: true,
        address: properties[i - 1].address,
        meetingPoint: 'Front entrance',
        parkingInfo: 'Street parking available',
        accessInstructions: 'Ring the doorbell and we will let you in',
        virtualTour: {
          platform: 'zoom',
          link: `https://zoom.us/j/123456789${i}`,
          password: 'openhouse123',
          instructions: 'Download Zoom app before joining'
        },
        isRecurring: false,
        attendees: [],
        rsvps: [],
        createdAt: new Date()
      });
      await openHouse.save();
      console.log(`Created open house ${i}`);
    }

    console.log('✅ Sample seller data created successfully!');
    console.log(`📊 Created:`);
    console.log(`   - 1 seller user`);
    console.log(`   - 3 properties`);
    console.log(`   - 5 inquiries`);
    console.log(`   - 3 analytics records`);
    console.log(`   - 2 open houses`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeder
seedSellerData();
