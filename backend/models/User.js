const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [8, 255]
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_picture'
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    userType: {
      type: DataTypes.ENUM('buyer', 'seller', 'renter', 'agent', 'admin'),
      allowNull: false,
      field: 'user_type'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    verificationBadge: {
      type: DataTypes.ENUM('none', 'bronze', 'silver', 'gold', 'platinum'),
      defaultValue: 'none',
      field: 'verification_badge'
    },
    // Agent specific fields (stored as JSON)
    agent: {
      type: DataTypes.JSON,
      allowNull: true
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'license_number'
    },
    specialties: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Location (stored as JSON for flexibility)
    location: {
      type: DataTypes.JSON,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_blocked'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    socialLinks: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'social_links'
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true
    },
    notificationSettings: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'notification_settings'
    },
    stats: {
      type: DataTypes.JSON,
      allowNull: true
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_enabled'
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'login_attempts'
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'lock_until'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'email_verification_token'
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password_reset_token'
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['user_type', 'is_verified']
      },
      {
        fields: ['agent'],
        using: 'BTREE'
      }
    ],
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  User.prototype.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
  };

  User.prototype.incLoginAttempts = async function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
      return this.update({
        lockUntil: null,
        loginAttempts: 1
      });
    }
    
    const updates = { loginAttempts: this.loginAttempts + 1 };
    if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
      updates.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }
    
    return this.update(updates);
  };

  // Virtual fields (computed properties)
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    values.fullName = this.getFullName();
    values.isAgent = this.userType === 'agent';
    values.isVerifiedUser = this.isVerified && this.verificationBadge !== 'none';
    return values;
  };

  return User;
};