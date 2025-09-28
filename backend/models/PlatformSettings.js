module.exports = (sequelize, DataTypes) => {
  const PlatformSettings = sequelize.define('PlatformSettings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // General settings (stored as JSON)
    general: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Appearance settings (stored as JSON)
    appearance: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Business settings (stored as JSON)
    business: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Feature settings (stored as JSON)
    features: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Security settings (stored as JSON)
    security: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Notification settings (stored as JSON)
    notifications: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Maintenance settings (stored as JSON)
    maintenance: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'platform_settings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['id'],
        unique: true
      }
    ]
  });

  // Static method to get or create platform settings
  PlatformSettings.getSettings = async function() {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      // Create with default values
      settings = await PlatformSettings.create({
        general: {
          siteName: 'Real Estate Platform',
          siteDescription: 'Your trusted platform for real estate transactions',
          contactEmail: 'contact@realestate.com',
          contactPhone: '+1 (555) 123-4567',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States'
          },
          logo: '',
          favicon: '',
          socialMedia: {
            facebook: '',
            twitter: '',
            linkedin: '',
            instagram: ''
          }
        },
        appearance: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1F2937',
          theme: 'light',
          customCSS: ''
        },
        business: {
          commissionRate: 5.0,
          featuredListingPrice: 29.99,
          premiumFeatures: [],
          currency: 'USD',
          taxRate: 0
        },
        features: {
          enableReviews: true,
          enableMessaging: true,
          enableNotifications: true,
          enableAdvancedSearch: true,
          enableVirtualTours: false,
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
            welcome: '',
            listingApproved: '',
            listingRejected: '',
            newMessage: '',
            passwordReset: ''
          },
          smsEnabled: false,
          pushNotifications: true
        },
        maintenance: {
          isMaintenanceMode: false,
          maintenanceMessage: '',
          maintenanceStartTime: null,
          maintenanceEndTime: null,
          allowedIPs: []
        }
      });
    }
    return settings;
  };

  // Instance method to update specific section
  PlatformSettings.prototype.updateSection = async function(section, data) {
    const currentData = this[section] || {};
    this[section] = { ...currentData, ...data };
    return this.save();
  };

  // Instance method to reset to defaults
  PlatformSettings.prototype.resetToDefaults = async function() {
    const defaults = {
      general: {
        siteName: 'Real Estate Platform',
        siteDescription: 'Your trusted platform for real estate transactions',
        contactEmail: 'contact@realestate.com',
        contactPhone: '+1 (555) 123-4567',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        logo: '',
        favicon: '',
        socialMedia: {
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: ''
        }
      },
      appearance: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1F2937',
        theme: 'light',
        customCSS: ''
      },
      business: {
        commissionRate: 5.0,
        featuredListingPrice: 29.99,
        premiumFeatures: [],
        currency: 'USD',
        taxRate: 0
      },
      features: {
        enableReviews: true,
        enableMessaging: true,
        enableNotifications: true,
        enableAdvancedSearch: true,
        enableVirtualTours: false,
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
          welcome: '',
          listingApproved: '',
          listingRejected: '',
          newMessage: '',
          passwordReset: ''
        },
        smsEnabled: false,
        pushNotifications: true
      },
      maintenance: {
        isMaintenanceMode: false,
        maintenanceMessage: '',
        maintenanceStartTime: null,
        maintenanceEndTime: null,
        allowedIPs: []
      }
    };

    this.general = defaults.general;
    this.appearance = defaults.appearance;
    this.business = defaults.business;
    this.features = defaults.features;
    this.security = defaults.security;
    this.notifications = defaults.notifications;
    this.maintenance = defaults.maintenance;
    
    return this.save();
  };

  return PlatformSettings;
};