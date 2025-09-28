const { sequelize } = require('./config/database');
const { User, Property } = require('./models');
const bcrypt = require('bcryptjs');

async function insertBasicData() {
  try {
    console.log('🔄 Inserting basic dummy data...');
    
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create users for all roles
    const users = [
      // Admin user
      {
        email: 'admin@realestate.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'admin',
        phone: '+1-555-0001',
        isVerified: true,
        verificationBadge: 'platinum',
        isActive: true
      },
      // Agent users
      {
        email: 'agent1@realestate.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        userType: 'agent',
        phone: '+1-555-0002',
        isVerified: true,
        verificationBadge: 'gold',
        isActive: true,
        company: 'Premium Real Estate',
        specialties: ['luxury_homes', 'commercial', 'investment_properties'],
        location: {
          city: 'New York',
          state: 'NY',
          country: 'USA'
        }
      },
      {
        email: 'agent2@realestate.com',
        password: hashedPassword,
        firstName: 'Michael',
        lastName: 'Chen',
        userType: 'agent',
        phone: '+1-555-0003',
        isVerified: true,
        verificationBadge: 'silver',
        isActive: true,
        company: 'City Properties',
        specialties: ['apartments', 'condos', 'first_time_buyers'],
        location: {
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA'
        }
      },
      // Seller users
      {
        email: 'seller1@email.com',
        password: hashedPassword,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        userType: 'seller',
        phone: '+1-555-0004',
        isVerified: true,
        verificationBadge: 'bronze',
        isActive: true,
        location: {
          city: 'Miami',
          state: 'FL',
          country: 'USA'
        }
      },
      {
        email: 'seller2@email.com',
        password: hashedPassword,
        firstName: 'David',
        lastName: 'Thompson',
        userType: 'seller',
        phone: '+1-555-0005',
        isVerified: false,
        verificationBadge: 'none',
        isActive: true,
        location: {
          city: 'Seattle',
          state: 'WA',
          country: 'USA'
        }
      },
      // Buyer users
      {
        email: 'buyer1@email.com',
        password: hashedPassword,
        firstName: 'Jessica',
        lastName: 'Williams',
        userType: 'buyer',
        phone: '+1-555-0006',
        isVerified: true,
        verificationBadge: 'bronze',
        isActive: true,
        location: {
          city: 'Chicago',
          state: 'IL',
          country: 'USA'
        }
      },
      {
        email: 'buyer2@email.com',
        password: hashedPassword,
        firstName: 'Robert',
        lastName: 'Brown',
        userType: 'buyer',
        phone: '+1-555-0007',
        isVerified: false,
        verificationBadge: 'none',
        isActive: true,
        location: {
          city: 'Austin',
          state: 'TX',
          country: 'USA'
        }
      },
      // Renter users
      {
        email: 'renter1@email.com',
        password: hashedPassword,
        firstName: 'Amanda',
        lastName: 'Davis',
        userType: 'renter',
        phone: '+1-555-0008',
        isVerified: true,
        verificationBadge: 'bronze',
        isActive: true,
        location: {
          city: 'Denver',
          state: 'CO',
          country: 'USA'
        }
      },
      {
        email: 'renter2@email.com',
        password: hashedPassword,
        firstName: 'James',
        lastName: 'Wilson',
        userType: 'renter',
        phone: '+1-555-0009',
        isVerified: false,
        verificationBadge: 'none',
        isActive: true,
        location: {
          city: 'Portland',
          state: 'OR',
          country: 'USA'
        }
      }
    ];

    // Insert users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of users) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });
      createdUsers.push(user);
      console.log(`✅ ${created ? 'Created' : 'Found existing'} user: ${user.email} (${user.userType})`);
    }

    // Create properties
    console.log('🏠 Creating properties...');
    const properties = [
      {
        title: 'Luxury Downtown Penthouse',
        description: 'Stunning penthouse with panoramic city views, modern amenities, and premium finishes throughout. Perfect for executives and luxury living.',
        propertyType: 'apartment',
        listingType: 'sale',
        price: 2500000,
        currency: 'USD',
        status: 'active',
        ownerId: createdUsers.find(u => u.email === 'seller1@email.com').id,
        agentId: createdUsers.find(u => u.email === 'agent1@realestate.com').id,
        address: {
          street: '123 Luxury Avenue',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        location: { type: 'Point', coordinates: [-74.006, 40.7128] },
        details: {
          bedrooms: 3,
          bathrooms: 2,
          squareMeters: 200,
          yearBuilt: 2020
        },
        features: {
          parkingAvailable: true,
          furnished: false,
          petFriendly: true,
          featured: true
        },
        amenities: ['Gym', 'Pool', 'Concierge', 'Rooftop', 'Parking'],
        photos: [
          {
            url: '/uploads/property-images/luxury-penthouse-1.jpg',
            caption: 'Living room with city views',
            isPrimary: true,
            order: 1
          }
        ]
      },
      {
        title: 'Cozy Family House',
        description: 'Beautiful family home in quiet neighborhood with large backyard, perfect for families with children.',
        propertyType: 'house',
        listingType: 'sale',
        price: 750000,
        currency: 'USD',
        status: 'active',
        ownerId: createdUsers.find(u => u.email === 'seller2@email.com').id,
        agentId: createdUsers.find(u => u.email === 'agent2@realestate.com').id,
        address: {
          street: '456 Maple Street',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        location: { type: 'Point', coordinates: [-118.2437, 34.0522] },
        details: {
          bedrooms: 4,
          bathrooms: 3,
          squareMeters: 250,
          yearBuilt: 2015
        },
        features: {
          parkingAvailable: true,
          furnished: false,
          petFriendly: true,
          featured: false
        },
        amenities: ['Garden', 'Garage', 'Fireplace', 'Hardwood Floors'],
        photos: [
          {
            url: '/uploads/property-images/family-house-1.jpg',
            caption: 'Front view of the house',
            isPrimary: true,
            order: 1
          }
        ]
      },
      {
        title: 'Modern Studio Apartment',
        description: 'Contemporary studio apartment in the heart of the city, perfect for young professionals.',
        propertyType: 'apartment',
        listingType: 'rent',
        price: 2500,
        currency: 'USD',
        status: 'active',
        ownerId: createdUsers.find(u => u.email === 'seller1@email.com').id,
        agentId: createdUsers.find(u => u.email === 'agent1@realestate.com').id,
        address: {
          street: '789 Urban Lane',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101',
          country: 'USA'
        },
        location: { type: 'Point', coordinates: [-80.1918, 25.7617] },
        details: {
          bedrooms: 1,
          bathrooms: 1,
          squareMeters: 50,
          yearBuilt: 2022
        },
        features: {
          parkingAvailable: false,
          furnished: true,
          petFriendly: false,
          featured: false
        },
        amenities: ['Gym', 'Laundry', 'Elevator', 'Balcony'],
        photos: [
          {
            url: '/uploads/property-images/studio-apartment-1.jpg',
            caption: 'Modern studio interior',
            isPrimary: true,
            order: 1
          }
        ]
      },
      {
        title: 'Spacious Office Space',
        description: 'Prime commercial office space in business district, ideal for growing companies.',
        propertyType: 'office',
        listingType: 'rent',
        price: 5000,
        currency: 'USD',
        status: 'active',
        ownerId: createdUsers.find(u => u.email === 'seller2@email.com').id,
        agentId: createdUsers.find(u => u.email === 'agent2@realestate.com').id,
        address: {
          street: '321 Business Boulevard',
          city: 'Seattle',
          state: 'WA',
          zipCode: '98101',
          country: 'USA'
        },
        location: { type: 'Point', coordinates: [-122.3321, 47.6062] },
        details: {
          bedrooms: 0,
          bathrooms: 2,
          squareMeters: 300,
          yearBuilt: 2018
        },
        features: {
          parkingAvailable: true,
          furnished: false,
          petFriendly: false,
          featured: true
        },
        amenities: ['Reception', 'Conference Rooms', 'Parking', 'Security'],
        photos: [
          {
            url: '/uploads/property-images/office-space-1.jpg',
            caption: 'Modern office interior',
            isPrimary: true,
            order: 1
          }
        ]
      },
      {
        title: 'Beachfront Villa',
        description: 'Exclusive beachfront villa with private beach access, perfect for vacation rental or permanent residence.',
        propertyType: 'house',
        listingType: 'sale',
        price: 5000000,
        currency: 'USD',
        status: 'active',
        ownerId: createdUsers.find(u => u.email === 'seller1@email.com').id,
        agentId: createdUsers.find(u => u.email === 'agent1@realestate.com').id,
        address: {
          street: '555 Ocean Drive',
          city: 'Miami',
          state: 'FL',
          zipCode: '33139',
          country: 'USA'
        },
        location: { type: 'Point', coordinates: [-80.1300, 25.7907] },
        details: {
          bedrooms: 5,
          bathrooms: 4,
          squareMeters: 400,
          yearBuilt: 2021
        },
        features: {
          parkingAvailable: true,
          furnished: true,
          petFriendly: true,
          featured: true
        },
        amenities: ['Private Beach', 'Pool', 'Garden', 'Garage', 'Security'],
        photos: [
          {
            url: '/uploads/property-images/beachfront-villa-1.jpg',
            caption: 'Beachfront view',
            isPrimary: true,
            order: 1
          }
        ]
      }
    ];

    // Insert properties
    for (const propertyData of properties) {
      const [property, created] = await Property.findOrCreate({
        where: { 
          title: propertyData.title,
          ownerId: propertyData.ownerId
        },
        defaults: propertyData
      });
      console.log(`✅ ${created ? 'Created' : 'Found existing'} property: ${property.title}`);
    }

    console.log('🎉 Basic dummy data insertion completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users created: ${createdUsers.length}`);
    console.log(`🏠 Properties created: ${properties.length}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('All users have the password: password123');
    console.log('\nAdmin: admin@realestate.com');
    console.log('Agent 1: agent1@realestate.com');
    console.log('Agent 2: agent2@realestate.com');
    console.log('Seller 1: seller1@email.com');
    console.log('Seller 2: seller2@email.com');
    console.log('Buyer 1: buyer1@email.com');
    console.log('Buyer 2: buyer2@email.com');
    console.log('Renter 1: renter1@email.com');
    console.log('Renter 2: renter2@email.com');
    
  } catch (error) {
    console.error('❌ Error inserting basic dummy data:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  insertBasicData();
}

module.exports = insertBasicData;
