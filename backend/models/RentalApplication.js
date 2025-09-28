const mongoose = require('mongoose');

const rentalApplicationSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  // Personal Information
  personalInfo: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
<<<<<<< Updated upstream
    currentAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
=======
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
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    }
  },
  // Employment Information
  employment: {
    employer: String,
    jobTitle: String,
    monthlyIncome: Number,
    employmentDuration: String, // e.g., "2 years"
    workPhone: String
  },
  // Rental Information
  rentalInfo: {
    desiredMoveInDate: {
      type: Date,
      required: true
    },
    leaseDuration: {
      type: Number, // in months
      required: true
    },
    numberOfOccupants: {
      type: Number,
      default: 1
    },
    hasPets: {
      type: Boolean,
      default: false
    },
    petDetails: String,
    previousLandlord: {
      name: String,
      phone: String,
      email: String
    },
    previousRentalHistory: String
  },
  // Financial Information
  financialInfo: {
    annualIncome: Number,
    creditScore: Number,
    bankName: String,
    accountType: String,
    hasGuarantor: {
      type: Boolean,
      default: false
    },
    guarantorInfo: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
      address: String
    }
  },
  // Additional Information
  additionalInfo: {
    reasonForMoving: String,
    specialRequirements: String,
    additionalComments: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String
    }
  },
  // Documents (file paths or URLs)
  documents: [{
    type: {
      type: String,
      enum: ['id', 'paystub', 'bankStatement', 'reference', 'other']
    },
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isFromLandlord: {
      type: Boolean,
      default: false
    }
  }],
  // Decision Information
  decision: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    decisionDate: Date,
    decisionReason: String,
    decisionNotes: String,
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

<<<<<<< Updated upstream
// Indexes for better query performance
rentalApplicationSchema.index({ property: 1, applicant: 1 });
rentalApplicationSchema.index({ landlord: 1, status: 1 });
rentalApplicationSchema.index({ applicant: 1, status: 1 });
rentalApplicationSchema.index({ status: 1, applicationDate: -1 });
=======
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
>>>>>>> Stashed changes

// Virtual for full name
rentalApplicationSchema.virtual('applicantName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

<<<<<<< Updated upstream
// Virtual for application age
rentalApplicationSchema.virtual('applicationAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.applicationDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});
=======
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
>>>>>>> Stashed changes

module.exports = mongoose.model('RentalApplication', rentalApplicationSchema);
