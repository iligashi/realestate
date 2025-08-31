const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  general: {
    siteName: {
      type: String,
      default: 'Real Estate Platform',
      trim: true,
      maxlength: 100
    },
    siteDescription: {
      type: String,
      default: 'Your trusted platform for real estate transactions',
      trim: true,
      maxlength: 500
    },
    contactEmail: {
      type: String,
      default: 'contact@realestate.com',
      trim: true
    },
    contactPhone: {
      type: String,
      default: '+1 (555) 123-4567',
      trim: true
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, default: 'United States', trim: true }
    },
    logo: {
      type: String,
      default: ''
    },
    favicon: {
      type: String,
      default: ''
    },
    socialMedia: {
      facebook: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      instagram: { type: String, trim: true }
    }
  },
  appearance: {
    primaryColor: {
      type: String,
      default: '#3B82F6',
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Primary color must be a valid hex color'
      }
    },
    secondaryColor: {
      type: String,
      default: '#1F2937',
      validate: {
        validator: function(v) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Secondary color must be a valid hex color'
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    customCSS: {
      type: String,
      maxlength: 10000
    }
  },
  business: {
    commissionRate: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 100
    },
    featuredListingPrice: {
      type: Number,
      default: 29.99,
      min: 0
    },
    premiumFeatures: [{
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      description: { type: String },
      isActive: { type: Boolean, default: true }
    }],
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  features: {
    enableReviews: { type: Boolean, default: true },
    enableMessaging: { type: Boolean, default: true },
    enableNotifications: { type: Boolean, default: true },
    enableAdvancedSearch: { type: Boolean, default: true },
    enableVirtualTours: { type: Boolean, default: false },
    enableAIChatbot: { type: Boolean, default: false },
    maxImagesPerListing: { type: Number, default: 20, min: 1, max: 100 },
    maxListingsPerUser: { type: Number, default: 10, min: 1, max: 100 }
  },
  security: {
    requireEmailVerification: { type: Boolean, default: true },
    requirePhoneVerification: { type: Boolean, default: false },
    requireIDVerification: { type: Boolean, default: false },
    maxLoginAttempts: { type: Number, default: 5, min: 1, max: 10 },
    sessionTimeout: { type: Number, default: 24, min: 1, max: 168 }, // hours
    enableTwoFactorAuth: { type: Boolean, default: false }
  },
  notifications: {
    emailTemplates: {
      welcome: { type: String, maxlength: 2000 },
      listingApproved: { type: String, maxlength: 2000 },
      listingRejected: { type: String, maxlength: 2000 },
      newMessage: { type: String, maxlength: 2000 },
      passwordReset: { type: String, maxlength: 2000 }
    },
    smsEnabled: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true }
  },
  maintenance: {
    isMaintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, maxlength: 1000 },
    maintenanceStartTime: Date,
    maintenanceEndTime: Date,
    allowedIPs: [String]
  }
}, {
  timestamps: true
});

// Ensure only one platform settings document exists
platformSettingsSchema.index({}, { unique: true });

// Static method to get or create platform settings
platformSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Method to update specific section
platformSettingsSchema.methods.updateSection = function(section, data) {
  this[section] = { ...this[section], ...data };
  return this.save();
};

// Method to reset to defaults
platformSettingsSchema.methods.resetToDefaults = function() {
  this.general = platformSettingsSchema.path('general').defaultValue;
  this.appearance = platformSettingsSchema.path('appearance').defaultValue;
  this.business = platformSettingsSchema.path('business').defaultValue;
  this.features = platformSettingsSchema.path('features').defaultValue;
  this.security = platformSettingsSchema.path('security').defaultValue;
  this.notifications = platformSettingsSchema.path('notifications').defaultValue;
  this.maintenance = platformSettingsSchema.path('maintenance').defaultValue;
  return this.save();
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
