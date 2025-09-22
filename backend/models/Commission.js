const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  // Agent Information
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Transaction Information
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  
  // Commission Details
  transactionType: {
    type: String,
    enum: ['sale', 'rental', 'lease'],
    required: true
  },
  propertyPrice: {
    type: Number,
    required: true
  },
  commissionRate: {
    type: Number,
    required: true // percentage
  },
  commissionAmount: {
    type: Number,
    required: true
  },
  
  // Split Information (if working with other agents)
  isSplit: {
    type: Boolean,
    default: false
  },
  splitDetails: {
    coAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    splitPercentage: Number, // percentage of total commission
    coAgentAmount: Number
  },
  
  // Status and Payment
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'disputed', 'cancelled'],
    default: 'pending'
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['check', 'wire_transfer', 'direct_deposit', 'other']
  },
  paymentReference: String,
  
  // Transaction Timeline
  contractDate: Date,
  closingDate: Date,
  commissionEarnedDate: Date,
  
  // Additional Fees and Adjustments
  adjustments: [{
    type: {
      type: String,
      enum: ['bonus', 'penalty', 'fee', 'adjustment', 'other']
    },
    description: String,
    amount: Number,
    date: { type: Date, default: Date.now }
  }],
  
  // Notes and Documentation
  notes: String,
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Tax Information
  taxYear: Number,
  isTaxed: { type: Boolean, default: false },
  taxAmount: Number,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
commissionSchema.index({ agentId: 1, status: 1 });
commissionSchema.index({ propertyId: 1 });
commissionSchema.index({ clientId: 1 });
commissionSchema.index({ status: 1, paymentDate: -1 });
commissionSchema.index({ taxYear: 1, agentId: 1 });

// Pre-save middleware
commissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate commission amount if not provided
  if (!this.commissionAmount && this.propertyPrice && this.commissionRate) {
    this.commissionAmount = (this.propertyPrice * this.commissionRate) / 100;
  }
  
  // Calculate split amounts if applicable
  if (this.isSplit && this.splitDetails && this.splitDetails.splitPercentage) {
    this.splitDetails.coAgentAmount = (this.commissionAmount * this.splitDetails.splitPercentage) / 100;
  }
  
  next();
});

// Virtual fields
commissionSchema.virtual('netCommission').get(function() {
  let netAmount = this.commissionAmount;
  
  // Subtract co-agent amount if split
  if (this.isSplit && this.splitDetails && this.splitDetails.coAgentAmount) {
    netAmount -= this.splitDetails.coAgentAmount;
  }
  
  // Apply adjustments
  if (this.adjustments && this.adjustments.length > 0) {
    this.adjustments.forEach(adjustment => {
      netAmount += adjustment.amount;
    });
  }
  
  return netAmount;
});

commissionSchema.virtual('isPaid').get(function() {
  return this.status === 'paid';
});

commissionSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// Static methods
commissionSchema.statics.getTotalCommission = function(agentId, year = null) {
  const query = { agentId, status: 'paid' };
  if (year) {
    query.taxYear = year;
  }
  
  return this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
  ]);
};

commissionSchema.statics.getMonthlyCommission = function(agentId, year) {
  return this.aggregate([
    {
      $match: {
        agentId: mongoose.Types.ObjectId(agentId),
        status: 'paid',
        taxYear: year
      }
    },
    {
      $group: {
        _id: { $month: '$paymentDate' },
        total: { $sum: '$commissionAmount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.model('Commission', commissionSchema);
