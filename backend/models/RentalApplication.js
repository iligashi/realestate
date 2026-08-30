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
    },
    // Priority field
    priority: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'normal'
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
    let personalInfo = this.personalInfo || {};
    
    // Parse JSON if it's a string
    if (typeof personalInfo === 'string') {
      try {
        personalInfo = JSON.parse(personalInfo);
      } catch (e) {
        personalInfo = {};
      }
    }
    
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
    
    // Parse JSON fields if they are strings
    if (typeof values.personalInfo === 'string') {
      try {
        values.personalInfo = JSON.parse(values.personalInfo);
      } catch (e) {
        values.personalInfo = {};
      }
    }
    if (typeof values.employment === 'string') {
      try {
        values.employment = JSON.parse(values.employment);
      } catch (e) {
        values.employment = null;
      }
    }
    if (typeof values.rentalInfo === 'string') {
      try {
        values.rentalInfo = JSON.parse(values.rentalInfo);
      } catch (e) {
        values.rentalInfo = {};
      }
    }
    if (typeof values.financialInfo === 'string') {
      try {
        values.financialInfo = JSON.parse(values.financialInfo);
      } catch (e) {
        values.financialInfo = null;
      }
    }
    if (typeof values.additionalInfo === 'string') {
      try {
        values.additionalInfo = JSON.parse(values.additionalInfo);
      } catch (e) {
        values.additionalInfo = null;
      }
    }
    if (typeof values.documents === 'string') {
      try {
        values.documents = JSON.parse(values.documents);
      } catch (e) {
        values.documents = [];
      }
    }
    if (typeof values.messages === 'string') {
      try {
        values.messages = JSON.parse(values.messages);
      } catch (e) {
        values.messages = [];
      }
    }
    if (typeof values.decision === 'string') {
      try {
        values.decision = JSON.parse(values.decision);
      } catch (e) {
        values.decision = null;
      }
    }
    values.applicantName = this.getApplicantName();
    values.applicationAge = this.getApplicationAge();
    return values;
  };

  return RentalApplication;
};