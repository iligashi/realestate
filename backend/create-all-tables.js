const { sequelize } = require('./config/database');

async function createAllTables() {
  try {
    console.log('🔄 Creating all database tables...');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop existing tables in reverse order to handle foreign key constraints
    console.log('🗑️  Dropping existing tables...');
    const tablesToDrop = [
      'conversation_participants', 'conversations', 'listing_analytics', 'platform_settings',
      'reviews', 'reports', 'rental_applications', 'payments', 'open_houses', 'inquiries',
      'messages', 'notifications', 'favorites', 'appointments', 'announcements', 'properties', 'users'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`ℹ️  Table ${table} doesn't exist or couldn't be dropped: ${error.message}`);
      }
    }
    
    // Create users table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        profile_picture VARCHAR(500),
        avatar VARCHAR(500),
        bio TEXT,
        user_type ENUM('buyer', 'seller', 'renter', 'agent', 'admin') NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_badge ENUM('none', 'bronze', 'silver', 'gold', 'platinum') DEFAULT 'none',
        agent JSON,
        company VARCHAR(255),
        license_number VARCHAR(100),
        specialties JSON,
        location JSON,
        preferences JSON,
        is_active BOOLEAN DEFAULT TRUE,
        is_blocked BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP NULL,
        social_links JSON,
        documents JSON,
        notification_settings JSON,
        stats JSON,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        login_attempts INT DEFAULT 0,
        lock_until TIMESTAMP NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Create properties table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        property_type ENUM('house', 'apartment', 'office') NOT NULL,
        listing_type ENUM('sale', 'rent', 'rental', 'auction', 'pre-construction') NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        currency ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK') DEFAULT 'USD',
        price_history JSON,
        rent_period ENUM('monthly', 'weekly', 'daily', 'yearly') DEFAULT 'monthly',
        rental_details JSON,
        address JSON NOT NULL,
        location POINT NOT NULL,
        map_data JSON,
        details JSON,
        features JSON,
        amenities JSON,
        appliances JSON,
        heating VARCHAR(100),
        cooling VARCHAR(100),
        utilities JSON,
        is_featured BOOLEAN DEFAULT FALSE,
        featured_at TIMESTAMP NULL,
        featured_until TIMESTAMP NULL,
        featured_price DECIMAL(15,2),
        photos JSON,
        videos JSON,
        virtual_tours JSON,
        status ENUM('active', 'pending', 'sold', 'rented', 'inactive', 'under-contract') DEFAULT 'active',
        availability ENUM('immediate', '30-days', '60-days', '90-days', 'custom') DEFAULT 'immediate',
        available_from TIMESTAMP NULL,
        featured BOOLEAN DEFAULT FALSE,
        premium BOOLEAN DEFAULT FALSE,
        owner_id INT NOT NULL,
        agent_id INT,
        agency VARCHAR(255),
        property_tax DECIMAL(10,2),
        hoa_fees DECIMAL(10,2),
        hoa_frequency VARCHAR(50),
        insurance DECIMAL(10,2),
        documents JSON,
        neighborhood JSON,
        schools JSON,
        transportation JSON,
        sustainability JSON,
        analytics JSON,
        seo JSON,
        verified BOOLEAN DEFAULT FALSE,
        verification_date TIMESTAMP NULL,
        verified_by_id INT,
        custom_fields JSON,
        listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id),
        FOREIGN KEY (agent_id) REFERENCES users(id),
        FOREIGN KEY (verified_by_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Properties table created');
    
    // Create announcements table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        type ENUM('general', 'maintenance', 'update', 'alert', 'promotion') DEFAULT 'general',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        is_active BOOLEAN DEFAULT TRUE,
        is_pinned BOOLEAN DEFAULT FALSE,
        target_audience JSON DEFAULT ('["all"]'),
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP NULL,
        created_by INT NOT NULL,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✅ Announcements table created');
    
    // Create appointments table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description VARCHAR(500),
        requester_id INT NOT NULL,
        host_id INT NOT NULL,
        attendees JSON,
        property_id INT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NULL,
        duration INT,
        type ENUM('viewing', 'inspection', 'meeting', 'open_house', 'virtual_tour', 'closing') NOT NULL,
        status ENUM('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id),
        FOREIGN KEY (host_id) REFERENCES users(id),
        FOREIGN KEY (property_id) REFERENCES properties(id)
      )
    `);
    console.log('✅ Appointments table created');
    
    // Create favorites table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        property_id INT NOT NULL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (property_id) REFERENCES properties(id),
        UNIQUE KEY unique_user_property (user_id, property_id)
      )
    `);
    console.log('✅ Favorites table created');
    
    // Create notifications table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(100) NOT NULL,
        content VARCHAR(500) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (recipient_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Notifications table created');
    
    // Create messages table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        buyer_id INT,
        seller_id INT,
        renter_id INT,
        landlord_id INT,
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new', 'replied', 'closed') DEFAULT 'new',
        thread JSON,
        read_by JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (buyer_id) REFERENCES users(id),
        FOREIGN KEY (seller_id) REFERENCES users(id),
        FOREIGN KEY (renter_id) REFERENCES users(id),
        FOREIGN KEY (landlord_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Messages table created');
    
    // Create inquiries table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        seller_id INT NOT NULL,
        buyer_id INT NOT NULL,
        type ENUM('general', 'viewing', 'offer', 'negotiation', 'question') DEFAULT 'general',
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new', 'read', 'responded', 'scheduled', 'completed', 'closed') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (seller_id) REFERENCES users(id),
        FOREIGN KEY (buyer_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Inquiries table created');
    
    // Create open_houses table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS open_houses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        seller_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NULL,
        status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
        is_recurring BOOLEAN DEFAULT FALSE,
        recurring_pattern ENUM('weekly', 'bi-weekly', 'monthly'),
        max_attendees INT DEFAULT 20,
        rsvps JSON,
        virtual_tour JSON,
        is_public BOOLEAN DEFAULT TRUE,
        marketing_materials JSON,
        follow_up_notes TEXT,
        follow_up_date TIMESTAMP NULL,
        attendance JSON,
        reminders JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (seller_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Open houses table created');
    
    // Create payments table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        property_id INT,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        type ENUM('subscription', 'featured_listing', 'premium_upgrade', 'commission', 'refund') NOT NULL,
        status ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        payment_flow JSON,
        fees JSON,
        refund JSON,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (property_id) REFERENCES properties(id)
      )
    `);
    console.log('✅ Payments table created');
    
    // Create rental_applications table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS rental_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        applicant_id INT NOT NULL,
        landlord_id INT NOT NULL,
        status ENUM('submitted', 'under_review', 'approved', 'rejected', 'withdrawn') DEFAULT 'submitted',
        application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        personal_info JSON,
        employment JSON,
        rental_info JSON,
        financial_info JSON,
        additional_info JSON,
        documents JSON,
        messages JSON,
        decision JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (applicant_id) REFERENCES users(id),
        FOREIGN KEY (landlord_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Rental applications table created');
    
    // Create reports table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reporter_id INT NOT NULL,
        reported_item_type ENUM('property', 'user', 'message', 'review') NOT NULL,
        reported_item_id INT NOT NULL,
        type ENUM('spam', 'inappropriate', 'fraud', 'harassment', 'other') NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending', 'under_review', 'resolved', 'dismissed') DEFAULT 'pending',
        evidence JSON,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Reports table created');
    
    // Create reviews table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reviewer_id INT NOT NULL,
        target_type ENUM('property', 'user', 'agent') NOT NULL,
        target_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(200),
        content TEXT,
        ratings JSON,
        flags JSON,
        helpful JSON,
        photos JSON,
        context JSON,
        analytics JSON,
        response JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reviewer_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Reviews table created');
    
    // Create platform_settings table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        general JSON,
        appearance JSON,
        business JSON,
        features JSON,
        security JSON,
        notifications JSON,
        maintenance JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Platform settings table created');
    
    // Create listing_analytics table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS listing_analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        seller_id INT NOT NULL,
        views JSON,
        saves JSON,
        shares JSON,
        inquiries JSON,
        response_time JSON,
        conversion JSON,
        traffic_sources JSON,
        devices JSON,
        locations JSON,
        hourly_views JSON,
        daily_views JSON,
        weekly_views JSON,
        monthly_views JSON,
        price_changes JSON,
        competitor_data JSON,
        market_trends JSON,
        performance_score DECIMAL(3,2),
        recommendations JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (seller_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Listing analytics table created');
    
    // Create conversations table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        last_message JSON,
        unread_counts JSON,
        settings JSON,
        analytics JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id)
      )
    `);
    console.log('✅ Conversations table created');
    
    // Create conversation_participants junction table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_read_at TIMESTAMP NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_conversation_user (conversation_id, user_id)
      )
    `);
    console.log('✅ Conversation participants table created');
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Add spatial index for properties location
    try {
      await sequelize.query('CREATE SPATIAL INDEX idx_properties_location ON properties (location)');
      console.log('✅ Spatial index added for properties location');
    } catch (spatialError) {
      if (spatialError.message.includes('Duplicate key name')) {
        console.log('ℹ️  Spatial index already exists');
      } else {
        console.log('⚠️  Could not create spatial index:', spatialError.message);
      }
    }
    
    console.log('🎉 All database tables created successfully!');
    console.log('📊 You can now start your server with: npm start');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createAllTables();
}

module.exports = createAllTables;
