module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'requester_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    hostId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'host_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    attendees: {
      type: DataTypes.JSON,
      allowNull: true
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
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in minutes'
    },
    type: {
      type: DataTypes.ENUM('viewing', 'inspection', 'meeting', 'open_house', 'virtual_tour', 'closing'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show'),
      defaultValue: 'pending'
    },
    // Location details (stored as JSON)
    location: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Virtual meeting details (stored as JSON)
    virtualMeeting: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'virtual_meeting'
    },
    specialRequirements: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'special_requirements'
    },
    accessibility: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Confirmation and reminders (stored as JSON)
    confirmation: {
      type: DataTypes.JSON,
      allowNull: true
    },
    reminders: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Rescheduling and cancellation (stored as JSON)
    reschedule: {
      type: DataTypes.JSON,
      allowNull: true
    },
    cancellation: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Feedback and ratings (stored as JSON)
    feedback: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Follow-up (stored as JSON)
    followUp: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'follow_up'
    },
    // Analytics (stored as JSON)
    analytics: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Metadata
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    }
  }, {
    tableName: 'appointments',
    timestamps: true,
    underscored: true,
    indexes: [
      // Temporarily removed complex indexes to avoid key length issues
    ],
    hooks: {
      beforeSave: (appointment) => {
        if (appointment.startTime && appointment.endTime && !appointment.duration) {
          appointment.duration = Math.round((appointment.endTime - appointment.startTime) / (1000 * 60));
        }
      }
    }
  });

  // Instance methods
  Appointment.prototype.isUpcoming = function() {
    return this.startTime > new Date() && this.status === 'confirmed';
  };

  Appointment.prototype.isPast = function() {
    return this.endTime < new Date();
  };

  Appointment.prototype.isToday = function() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    return this.startTime >= startOfDay && this.startTime < endOfDay;
  };

  Appointment.prototype.getTimeUntilStart = function() {
    const now = new Date();
    const timeDiff = this.startTime - now;
    if (timeDiff <= 0) return 0;
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  Appointment.prototype.confirm = async function(confirmedBy, method = 'platform') {
    this.status = 'confirmed';
    this.confirmation = {
      confirmedAt: new Date(),
      confirmedBy: confirmedBy,
      confirmationMethod: method
    };
    return this.save();
  };

  Appointment.prototype.rescheduleAppointment = async function(newStartTime, newEndTime, reason, requestedBy) {
    this.reschedule = {
      originalStartTime: this.startTime,
      originalEndTime: this.endTime,
      reason: reason,
      requestedBy: requestedBy,
      requestedAt: new Date()
    };
    
    this.startTime = newStartTime;
    this.endTime = newEndTime;
    this.status = 'rescheduled';
    
    if (this.duration) {
      this.duration = Math.round((newEndTime - newStartTime) / (1000 * 60));
    }
    
    return this.save();
  };

  Appointment.prototype.cancel = async function(reason, cancelledBy, refundRequired = false, refundAmount = 0) {
    this.status = 'cancelled';
    this.cancellation = {
      reason: reason,
      cancelledBy: cancelledBy,
      cancelledAt: new Date(),
      refundRequired: refundRequired,
      refundAmount: refundAmount
    };
    return this.save();
  };

  Appointment.prototype.complete = async function() {
    this.status = 'completed';
    return this.save();
  };

  Appointment.prototype.markNoShow = async function() {
    this.status = 'no_show';
    return this.save();
  };

  // Static methods
  Appointment.findUpcoming = function(userId, options = {}) {
    const query = {
      where: {
        [sequelize.Op.or]: [
          { requesterId: userId },
          { hostId: userId }
        ],
        startTime: { [sequelize.Op.gt]: new Date() },
        status: { [sequelize.Op.in]: ['confirmed', 'pending'] }
      },
      order: [['start_time', 'ASC']]
    };
    
    if (options.property) {
      query.where.propertyId = options.property;
    }
    
    return this.findAll(query);
  };

  Appointment.findConflicts = function(propertyId, startTime, endTime, excludeId = null) {
    const query = {
      where: {
        propertyId: propertyId,
        status: { [sequelize.Op.in]: ['confirmed', 'pending'] },
        [sequelize.Op.or]: [
          { startTime: { [sequelize.Op.lt]: endTime, [sequelize.Op.gte]: startTime } },
          { endTime: { [sequelize.Op.gt]: startTime, [sequelize.Op.lte]: endTime } },
          { 
            startTime: { [sequelize.Op.lte]: startTime }, 
            endTime: { [sequelize.Op.gte]: endTime } 
          }
        ]
      }
    };
    
    if (excludeId) {
      query.where.id = { [sequelize.Op.ne]: excludeId };
    }
    
    return this.findAll(query);
  };

  Appointment.findToday = function(userId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          { requesterId: userId },
          { hostId: userId }
        ],
        startTime: { [sequelize.Op.gte]: startOfDay, [sequelize.Op.lt]: endOfDay },
        status: 'confirmed'
      }
    });
  };

  // Virtual fields (computed properties)
  Appointment.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.isUpcoming = this.isUpcoming();
    values.isPast = this.isPast();
    values.isToday = this.isToday();
    values.timeUntilStart = this.getTimeUntilStart();
    return values;
  };

  return Appointment;
};