const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  
  // User Type & Role
  userType: {
    type: String,
    enum: ['buyer', 'seller', 'renter', 'agent', 'admin'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationBadge: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold', 'platinum'],
    default: 'none'
  },
  
  // Agent Specific Fields
  agent: {
    licenseNumber: String,
    agency: String,
    experience: Number, // years
    specializations: [String],
    languages: [String],
    responseTime: Number, // average response time in hours
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    }
  },
  
  // Location & Preferences
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  preferences: {
    propertyTypes: [String],
    priceRange: {
      min: Number,
      max: Number
    },
    locations: [String],
    amenities: [String]
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  
  // Social & Verification
  socialLinks: {
    linkedin: String,
    website: String
  },
  documents: [{
    type: String,
    url: String,
    verified: { type: Boolean, default: false }
  }],
  
  // Notifications
  notificationSettings: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    priceAlerts: { type: Boolean, default: true },
    newListings: { type: Boolean, default: true },
    messages: { type: Boolean, default: true }
  },
  
  // Stats & Analytics
  stats: {
    propertiesViewed: { type: Number, default: 0 },
    propertiesSaved: { type: Number, default: 0 },
    inquiriesSent: { type: Number, default: 0 },
    lastActivity: Date
  },
  
  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Timestamps
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ userType: 1, isVerified: 1 });
userSchema.index({ 'agent.rating.average': -1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return this.getFullName();
});

userSchema.virtual('isAgent').get(function() {
  return this.userType === 'agent';
});

userSchema.virtual('isVerifiedUser').get(function() {
  return this.isVerified && this.verificationBadge !== 'none';
});

module.exports = mongoose.model('User', userSchema);
