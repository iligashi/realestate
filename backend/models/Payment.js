const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Payment identification
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  stripePaymentIntentId: String,
  paypalOrderId: String,
  
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK']
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'cash', 'check', 'crypto'],
    required: true
  },
  
  // Payment type and purpose
  paymentType: {
    type: String,
    enum: ['rent', 'deposit', 'booking_fee', 'service_fee', 'subscription', 'refund'],
    required: true
  },
  
  // Related entities
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  
  // Payment flow
  paymentFlow: {
    initiatedAt: Date,
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    cancelledAt: Date
  },
  
  // Fee breakdown
  fees: {
    platformFee: Number,
    processingFee: Number,
    taxAmount: Number,
    totalFees: Number
  },
  
  // Refund information
  refund: {
    amount: Number,
    reason: String,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Payment metadata
  metadata: {
    description: String,
    invoiceNumber: String,
    reference: String,
    notes: String,
    tags: [String]
  },
  
  // Recurring payment settings
  recurring: {
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'] },
    nextPaymentDate: Date,
    totalPayments: Number,
    completedPayments: { type: Number, default: 0 }
  },
  
  // Escrow settings (for deposits)
  escrow: {
    isEscrow: { type: Boolean, default: false },
    releaseDate: Date,
    releaseConditions: [String],
    releasedAt: Date,
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Dispute handling
  dispute: {
    isDisputed: { type: Boolean, default: false },
    disputeReason: String,
    disputeDate: Date,
    resolvedAt: Date,
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Payment verification
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationMethod: String
  },
  
  // Compliance and legal
  compliance: {
    kycVerified: { type: Boolean, default: false },
    amlChecked: { type: Boolean, default: false },
    taxForm: String,
    regulatoryNotes: String
  },
  
  // Analytics and tracking
  analytics: {
    processingTime: Number, // in milliseconds
    userAgent: String,
    ipAddress: String,
    deviceType: String,
    conversionSource: String
  },
  
  // Timestamps
  dueDate: Date,
  gracePeriod: Number, // in days
  lateFees: Number
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ paymentId: 1 }, { unique: true });
paymentSchema.index({ payer: 1, createdAt: -1 });
paymentSchema.index({ payee: 1, createdAt: -1 });
paymentSchema.index({ property: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentType: 1, status: 1 });
paymentSchema.index({ 'paymentFlow.completedAt': 1 });
paymentSchema.index({ 'recurring.nextPaymentDate': 1 });
paymentSchema.index({ 'escrow.releaseDate': 1 });

// Virtual fields
paymentSchema.virtual('totalAmount').get(function() {
  return this.amount + (this.fees.totalFees || 0);
});

paymentSchema.virtual('isLate').get(function() {
  if (!this.dueDate) return false;
  const now = new Date();
  const gracePeriod = this.gracePeriod || 0;
  const graceDate = new Date(this.dueDate);
  graceDate.setDate(graceDate.getDate() + gracePeriod);
  return now > graceDate;
});

paymentSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

paymentSchema.virtual('processingDuration').get(function() {
  if (this.paymentFlow.initiatedAt && this.paymentFlow.completedAt) {
    return this.paymentFlow.completedAt - this.paymentFlow.initiatedAt;
  }
  return null;
});

// Instance methods
paymentSchema.methods.processPayment = function() {
  this.status = 'processing';
  this.paymentFlow.processedAt = new Date();
  return this.save();
};

paymentSchema.methods.completePayment = function() {
  this.status = 'completed';
  this.paymentFlow.completedAt = new Date();
  this.verification.isVerified = true;
  this.verification.verifiedAt = new Date();
  return this.save();
};

paymentSchema.methods.failPayment = function(reason = 'Payment failed') {
  this.status = 'failed';
  this.paymentFlow.failedAt = new Date();
  this.metadata.notes = reason;
  return this.save();
};

paymentSchema.methods.cancelPayment = function(reason = 'Payment cancelled') {
  this.status = 'cancelled';
  this.paymentFlow.cancelledAt = new Date();
  this.metadata.notes = reason;
  return this.save();
};

paymentSchema.methods.processRefund = function(amount, reason, processedBy) {
  this.status = amount === this.amount ? 'refunded' : 'partially_refunded';
  this.refund = {
    amount: amount,
    reason: reason,
    processedAt: new Date(),
    processedBy: processedBy
  };
  return this.save();
};

paymentSchema.methods.releaseEscrow = function(releasedBy) {
  if (this.escrow.isEscrow) {
    this.escrow.releasedAt = new Date();
    this.escrow.releasedBy = releasedBy;
  }
  return this.save();
};

paymentSchema.methods.initiateDispute = function(reason) {
  this.dispute.isDisputed = true;
  this.dispute.disputeReason = reason;
  this.dispute.disputeDate = new Date();
  return this.save();
};

paymentSchema.methods.resolveDispute = function(resolution, resolvedBy) {
  this.dispute.resolvedAt = new Date();
  this.dispute.resolution = resolution;
  this.dispute.resolvedBy = resolvedBy;
  return this.save();
};

// Static methods
paymentSchema.statics.findByStatus = function(status) {
  return this.find({ status: status }).sort({ createdAt: -1 });
};

paymentSchema.statics.findOverduePayments = function() {
  const now = new Date();
  return this.find({
    status: 'pending',
    dueDate: { $lt: now }
  }).populate('payer', 'firstName lastName email');
};

paymentSchema.statics.findRecurringPayments = function() {
  const now = new Date();
  return this.find({
    'recurring.isRecurring': true,
    'recurring.nextPaymentDate': { $lte: now },
    status: { $in: ['completed', 'pending'] }
  });
};

paymentSchema.statics.findEscrowPayments = function() {
  const now = new Date();
  return this.find({
    'escrow.isEscrow': true,
    'escrow.releaseDate': { $lte: now },
    'escrow.releasedAt': { $exists: false }
  });
};

paymentSchema.statics.generatePaymentId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `pay_${timestamp}_${random}`.toUpperCase();
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.paymentId) {
    this.paymentId = this.constructor.generatePaymentId();
  }
  
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'processing':
        this.paymentFlow.processedAt = now;
        break;
      case 'completed':
        this.paymentFlow.completedAt = now;
        break;
      case 'failed':
        this.paymentFlow.failedAt = now;
        break;
      case 'cancelled':
        this.paymentFlow.cancelledAt = now;
        break;
    }
  }
  
  // Calculate total fees
  if (this.fees.platformFee || this.fees.processingFee || this.fees.taxAmount) {
    this.fees.totalFees = (this.fees.platformFee || 0) + 
                          (this.fees.processingFee || 0) + 
                          (this.fees.taxAmount || 0);
  }
  
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
