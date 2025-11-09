const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import all models
const User = require('./User')(sequelize, DataTypes);
const Property = require('./Property')(sequelize, DataTypes);
const Announcement = require('./Announcement')(sequelize, DataTypes);
const Appointment = require('./Appointment')(sequelize, DataTypes);
const Conversation = require('./Conversation')(sequelize, DataTypes);
const Favorite = require('./Favorite')(sequelize, DataTypes);
const Inquiry = require('./Inquiry')(sequelize, DataTypes);
const ListingAnalytics = require('./ListingAnalytics')(sequelize, DataTypes);
const Message = require('./Message')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);
const OpenHouse = require('./OpenHouse')(sequelize, DataTypes);
const Payment = require('./Payment')(sequelize, DataTypes);
const PlatformSettings = require('./PlatformSettings')(sequelize, DataTypes);
const RentalApplication = require('./RentalApplication')(sequelize, DataTypes);
const Report = require('./Report')(sequelize, DataTypes);
const Review = require('./Review')(sequelize, DataTypes);

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Property, { foreignKey: 'owner_id', as: 'ownedProperties' });
  User.hasMany(Property, { foreignKey: 'agent_id', as: 'agentProperties' });
  User.hasMany(Announcement, { foreignKey: 'created_by', as: 'announcements' });
  User.hasMany(Appointment, { foreignKey: 'requester_id', as: 'requestedAppointments' });
  User.hasMany(Appointment, { foreignKey: 'host_id', as: 'hostedAppointments' });
  User.hasMany(Favorite, { foreignKey: 'user_id', as: 'favorites' });
  User.hasMany(Inquiry, { foreignKey: 'seller_id', as: 'sellerInquiries' });
  User.hasMany(Inquiry, { foreignKey: 'buyer_id', as: 'buyerInquiries' });
  User.hasMany(ListingAnalytics, { foreignKey: 'seller_id', as: 'analytics' });
  User.hasMany(Message, { foreignKey: 'buyer_id', as: 'buyerMessages' });
  User.hasMany(Message, { foreignKey: 'seller_id', as: 'sellerMessages' });
  User.hasMany(Message, { foreignKey: 'renter_id', as: 'renterMessages' });
  User.hasMany(Message, { foreignKey: 'landlord_id', as: 'landlordMessages' });
  User.hasMany(Notification, { foreignKey: 'recipient_id', as: 'notifications' });
  User.hasMany(OpenHouse, { foreignKey: 'seller_id', as: 'openHouses' });
  User.hasMany(Payment, { foreignKey: 'payer_id', as: 'paymentsMade' });
  User.hasMany(Payment, { foreignKey: 'payee_id', as: 'paymentsReceived' });
  User.hasMany(RentalApplication, { foreignKey: 'applicant_id', as: 'applications' });
  User.hasMany(RentalApplication, { foreignKey: 'landlord_id', as: 'receivedApplications' });
  User.hasMany(Report, { foreignKey: 'reporterId', as: 'reports' });
  User.hasMany(Review, { foreignKey: 'author_id', as: 'reviews' });

  // Property associations
  Property.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
  Property.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });
  Property.hasMany(Appointment, { foreignKey: 'property_id', as: 'appointments' });
  Property.hasMany(Favorite, { foreignKey: 'property_id', as: 'favorites' });
  Property.hasMany(Inquiry, { foreignKey: 'property_id', as: 'inquiries' });
  Property.hasMany(ListingAnalytics, { foreignKey: 'property_id', as: 'listingAnalytics' });
  Property.hasMany(Message, { foreignKey: 'property_id', as: 'messages' });
  Property.hasMany(OpenHouse, { foreignKey: 'property_id', as: 'openHouses' });
  Property.hasMany(Payment, { foreignKey: 'property_id', as: 'payments' });
  Property.hasMany(RentalApplication, { foreignKey: 'property_id', as: 'rentalApplications' });
  Property.hasMany(Review, { foreignKey: 'target_id', as: 'reviews' });

  // Announcement associations
  Announcement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

  // Appointment associations
  Appointment.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });
  Appointment.belongsTo(User, { foreignKey: 'host_id', as: 'host' });
  Appointment.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

  // Conversation associations
  Conversation.belongsToMany(User, { 
    through: 'conversation_participants', 
    foreignKey: 'conversation_id',
    otherKey: 'user_id',
    as: 'participants'
  });
  Conversation.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

  // Favorite associations
  Favorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Favorite.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

  // Inquiry associations
  Inquiry.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
  Inquiry.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });
  Inquiry.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });

  // ListingAnalytics associations
  ListingAnalytics.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
  ListingAnalytics.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

  // Message associations
  Message.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
  Message.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });
  Message.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });
  Message.belongsTo(User, { foreignKey: 'renter_id', as: 'renter' });
  Message.belongsTo(User, { foreignKey: 'landlord_id', as: 'landlord' });
  Message.belongsTo(RentalApplication, { foreignKey: 'rental_application_id', as: 'rentalApplication' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });
  Notification.belongsTo(Property, { foreignKey: 'related_property_id', as: 'relatedProperty' });
  Notification.belongsTo(User, { foreignKey: 'related_user_id', as: 'relatedUser' });
  Notification.belongsTo(Message, { foreignKey: 'related_message_id', as: 'relatedMessage' });

  // OpenHouse associations
  OpenHouse.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
  OpenHouse.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

  // Payment associations
  Payment.belongsTo(User, { foreignKey: 'payer_id', as: 'payer' });
  Payment.belongsTo(User, { foreignKey: 'payee_id', as: 'payee' });
  Payment.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

  // RentalApplication associations
  RentalApplication.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
  RentalApplication.belongsTo(User, { foreignKey: 'applicant_id', as: 'applicant' });
  RentalApplication.belongsTo(User, { foreignKey: 'landlord_id', as: 'landlord' });

  // Report associations
  Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });

  // Review associations
  Review.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
};

// Initialize associations
defineAssociations();

module.exports = {
  sequelize,
  User,
  Property,
  Announcement,
  Appointment,
  Conversation,
  Favorite,
  Inquiry,
  ListingAnalytics,
  Message,
  Notification,
  OpenHouse,
  Payment,
  PlatformSettings,
  RentalApplication,
  Report,
  Review
};