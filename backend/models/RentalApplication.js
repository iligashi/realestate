module.exports = (sequelize, DataTypes) => {
  const RentalApplication = sequelize.define('RentalApplication', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'property_id',
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    applicantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'applicant_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    landlordId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'landlord_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'withdrawn'),
      defaultValue: 'pending'
    },
    applicationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'application_date'
    },
    // Personal Information (stored as JSON)
    personalInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'personal_info'
    },
    // Employment Information (stored as JSON)
    employment: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Rental Information (stored as JSON)
    rentalInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'rental_info'
    },
    // Financial Information (stored as JSON)
    financialInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'financial_info'
    },
    // Additional Information (stored as JSON)
    additionalInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'additional_info'
    },
    // Documents (stored as JSON)
    documents: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Communication (stored as JSON)
    messages: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Decision Information (stored as JSON)
    decision: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'rental_applications',
    timestamps: true,
    underscored: true,
    indexes: [
      // Temporarily removed complex indexes to avoid key length issues
    ]
  });

  // Instance methods
  RentalApplication.prototype.getApplicantName = function() {
    const personalInfo = this.personalInfo || {};
    return `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();
  };

  RentalApplication.prototype.getApplicationAge = function() {
    const now = new Date();
    const diffTime = Math.abs(now - this.applicationDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Virtual fields (computed properties)
  RentalApplication.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.applicantName = this.getApplicantName();
    values.applicationAge = this.getApplicationAge();
    return values;
  };

  return RentalApplication;
};