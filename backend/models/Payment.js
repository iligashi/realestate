module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'payment_id'
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_payment_intent_id'
    },
    paypalOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'paypal_order_id'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'),
      defaultValue: 'USD'
    },
    paymentMethod: {
      type: DataTypes.ENUM('stripe', 'paypal', 'bank_transfer', 'cash', 'check', 'crypto'),
      allowNull: false,
      field: 'payment_method'
    },
    paymentType: {
      type: DataTypes.ENUM('rent', 'deposit', 'booking_fee', 'service_fee', 'subscription', 'refund'),
      allowNull: false,
      field: 'payment_type'
    },
    payerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'payer_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    payeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'payee_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'property_id',
      references: {
        model: 'properties',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'),
      defaultValue: 'pending'
    },
    // Payment flow (stored as JSON)
    paymentFlow: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'payment_flow'
    },
    // Fee breakdown (stored as JSON)
    fees: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Refund information (stored as JSON)
    refund: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Payment metadata (stored as JSON)
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Recurring payment settings (stored as JSON)
    recurring: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Escrow settings (stored as JSON)
    escrow: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Dispute handling (stored as JSON)
    dispute: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Payment verification (stored as JSON)
    verification: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Compliance and legal (stored as JSON)
    compliance: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Analytics and tracking (stored as JSON)
    analytics: {
      type: DataTypes.JSON,
      allowNull: true
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date'
    },
    gracePeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'grace_period',
      comment: 'Grace period in days'
    },
    lateFees: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'late_fees'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['payment_id'],
        unique: true
      },
      {
        fields: ['payer_id', 'created_at']
      },
      {
        fields: ['payee_id', 'created_at']
      },
      {
        fields: ['property_id']
      },
      {
        fields: ['status', 'created_at']
      },
      {
        fields: ['payment_type', 'status']
      }
    ],
    hooks: {
      beforeCreate: (payment) => {
        if (!payment.paymentId) {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substr(2, 5);
          payment.paymentId = `pay_${timestamp}_${random}`.toUpperCase();
        }
      },
      beforeSave: (payment) => {
        if (payment.changed('status')) {
          const now = new Date();
          const paymentFlow = payment.paymentFlow || {};
          
          switch (payment.status) {
            case 'processing':
              paymentFlow.processedAt = now;
              break;
            case 'completed':
              paymentFlow.completedAt = now;
              break;
            case 'failed':
              paymentFlow.failedAt = now;
              break;
            case 'cancelled':
              paymentFlow.cancelledAt = now;
              break;
          }
          
          payment.paymentFlow = paymentFlow;
        }
        
        // Calculate total fees
        const fees = payment.fees || {};
        if (fees.platformFee || fees.processingFee || fees.taxAmount) {
          fees.totalFees = (fees.platformFee || 0) + 
                          (fees.processingFee || 0) + 
                          (fees.taxAmount || 0);
          payment.fees = fees;
        }
      }
    }
  });

  // Instance methods
  Payment.prototype.getTotalAmount = function() {
    const fees = this.fees || {};
    return parseFloat(this.amount) + (parseFloat(fees.totalFees) || 0);
  };

  Payment.prototype.isLate = function() {
    if (!this.dueDate) return false;
    const now = new Date();
    const gracePeriod = this.gracePeriod || 0;
    const graceDate = new Date(this.dueDate);
    graceDate.setDate(graceDate.getDate() + gracePeriod);
    return now > graceDate;
  };

  Payment.prototype.isOverdue = function() {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate;
  };

  Payment.prototype.getProcessingDuration = function() {
    const flow = this.paymentFlow || {};
    if (flow.initiatedAt && flow.completedAt) {
      return flow.completedAt - flow.initiatedAt;
    }
    return null;
  };

  Payment.prototype.processPayment = async function() {
    this.status = 'processing';
    const paymentFlow = this.paymentFlow || {};
    paymentFlow.processedAt = new Date();
    this.paymentFlow = paymentFlow;
    return this.save();
  };

  Payment.prototype.completePayment = async function() {
    this.status = 'completed';
    const paymentFlow = this.paymentFlow || {};
    const verification = this.verification || {};
    
    paymentFlow.completedAt = new Date();
    verification.isVerified = true;
    verification.verifiedAt = new Date();
    
    this.paymentFlow = paymentFlow;
    this.verification = verification;
    return this.save();
  };

  Payment.prototype.failPayment = async function(reason = 'Payment failed') {
    this.status = 'failed';
    const paymentFlow = this.paymentFlow || {};
    const metadata = this.metadata || {};
    
    paymentFlow.failedAt = new Date();
    metadata.notes = reason;
    
    this.paymentFlow = paymentFlow;
    this.metadata = metadata;
    return this.save();
  };

  Payment.prototype.cancelPayment = async function(reason = 'Payment cancelled') {
    this.status = 'cancelled';
    const paymentFlow = this.paymentFlow || {};
    const metadata = this.metadata || {};
    
    paymentFlow.cancelledAt = new Date();
    metadata.notes = reason;
    
    this.paymentFlow = paymentFlow;
    this.metadata = metadata;
    return this.save();
  };

  Payment.prototype.processRefund = async function(amount, reason, processedBy) {
    this.status = amount === this.amount ? 'refunded' : 'partially_refunded';
    this.refund = {
      amount: amount,
      reason: reason,
      processedAt: new Date(),
      processedBy: processedBy
    };
    return this.save();
  };

  Payment.prototype.releaseEscrow = async function(releasedBy) {
    const escrow = this.escrow || {};
    if (escrow.isEscrow) {
      escrow.releasedAt = new Date();
      escrow.releasedBy = releasedBy;
      this.escrow = escrow;
    }
    return this.save();
  };

  Payment.prototype.initiateDispute = async function(reason) {
    this.dispute = {
      isDisputed: true,
      disputeReason: reason,
      disputeDate: new Date()
    };
    return this.save();
  };

  Payment.prototype.resolveDispute = async function(resolution, resolvedBy) {
    const dispute = this.dispute || {};
    dispute.resolvedAt = new Date();
    dispute.resolution = resolution;
    dispute.resolvedBy = resolvedBy;
    this.dispute = dispute;
    return this.save();
  };

  // Static methods
  Payment.findByStatus = function(status) {
    return this.findAll({
      where: { status: status },
      order: [['created_at', 'DESC']]
    });
  };

  Payment.findOverduePayments = function() {
    const now = new Date();
    return this.findAll({
      where: {
        status: 'pending',
        dueDate: { [sequelize.Op.lt]: now }
      }
    });
  };

  Payment.findRecurringPayments = function() {
    const now = new Date();
    return this.findAll({
      where: {
        [sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn('JSON_EXTRACT', sequelize.col('recurring'), '$.isRecurring'),
            true
          ),
          sequelize.where(
            sequelize.fn('JSON_EXTRACT', sequelize.col('recurring'), '$.nextPaymentDate'),
            { [sequelize.Op.lte]: now }
          ),
          { status: { [sequelize.Op.in]: ['completed', 'pending'] } }
        ]
      }
    });
  };

  Payment.findEscrowPayments = function() {
    const now = new Date();
    return this.findAll({
      where: {
        [sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn('JSON_EXTRACT', sequelize.col('escrow'), '$.isEscrow'),
            true
          ),
          sequelize.where(
            sequelize.fn('JSON_EXTRACT', sequelize.col('escrow'), '$.releaseDate'),
            { [sequelize.Op.lte]: now }
          ),
          sequelize.where(
            sequelize.fn('JSON_EXTRACT', sequelize.col('escrow'), '$.releasedAt'),
            null
          )
        ]
      }
    });
  };

  Payment.generatePaymentId = function() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `pay_${timestamp}_${random}`.toUpperCase();
  };

  // Virtual fields (computed properties)
  Payment.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.totalAmount = this.getTotalAmount();
    values.isLate = this.isLate();
    values.isOverdue = this.isOverdue();
    values.processingDuration = this.getProcessingDuration();
    return values;
  };

  return Payment;
};