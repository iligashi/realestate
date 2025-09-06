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
    currentAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
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

// Indexes for better query performance
rentalApplicationSchema.index({ property: 1, applicant: 1 });
rentalApplicationSchema.index({ landlord: 1, status: 1 });
rentalApplicationSchema.index({ applicant: 1, status: 1 });
rentalApplicationSchema.index({ status: 1, applicationDate: -1 });

// Virtual for full name
rentalApplicationSchema.virtual('applicantName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for application age
rentalApplicationSchema.virtual('applicationAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.applicationDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

module.exports = mongoose.model('RentalApplication', rentalApplicationSchema);
