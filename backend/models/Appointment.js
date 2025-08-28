const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Appointment details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // Participants
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    phone: String,
    role: String // 'buyer', 'seller', 'agent', 'inspector', 'guest'
  }],
  
  // Property context
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  
  // Scheduling
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: Number, // in minutes
  
  // Appointment type
  type: {
    type: String,
    enum: ['viewing', 'inspection', 'meeting', 'open_house', 'virtual_tour', 'closing'],
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  
  // Location details
  location: {
    address: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    meetingPoint: String,
    parkingInfo: String,
    accessInstructions: String
  },
  
  // Virtual meeting details
  virtualMeeting: {
    platform: String, // 'zoom', 'teams', 'google_meet', 'skype'
    link: String,
    meetingId: String,
    password: String,
    instructions: String
  },
  
  // Special requirements
  specialRequirements: [String],
  accessibility: {
    wheelchairAccessible: Boolean,
    elevatorAvailable: Boolean,
    groundFloor: Boolean,
    notes: String
  },
  
  // Confirmation and reminders
  confirmation: {
    confirmedAt: Date,
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    confirmationMethod: String // 'email', 'phone', 'sms', 'platform'
  },
  
  reminders: [{
    type: String, // 'email', 'sms', 'push'
    sentAt: Date,
    scheduledFor: Date,
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }
  }],
  
  // Rescheduling and cancellation
  reschedule: {
    originalStartTime: Date,
    originalEndTime: Date,
    reason: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: Date
  },
  
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    refundRequired: Boolean,
    refundAmount: Number
  },
  
  // Feedback and ratings
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Follow-up
  followUp: {
    required: Boolean,
    scheduledFor: Date,
    completed: Boolean,
    notes: String,
    nextSteps: [String]
  },
  
  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    responses: { type: Number, default: 0 },
    responseTime: Number, // in hours
    conversionRate: Number
  },
  
  // Metadata
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
appointmentSchema.index({ requester: 1, startTime: 1 });
appointmentSchema.index({ host: 1, startTime: 1 });
appointmentSchema.index({ property: 1, startTime: 1 });
appointmentSchema.index({ status: 1, startTime: 1 });
appointmentSchema.index({ 'location.coordinates': '2dsphere' });
appointmentSchema.index({ startTime: 1, endTime: 1 });
appointmentSchema.index({ type: 1, status: 1 });

// Virtual fields
appointmentSchema.virtual('isUpcoming').get(function() {
  return this.startTime > new Date() && this.status === 'confirmed';
});

appointmentSchema.virtual('isPast').get(function() {
  return this.endTime < new Date();
});

appointmentSchema.virtual('isToday').get(function() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  return this.startTime >= startOfDay && this.startTime < endOfDay;
});

appointmentSchema.virtual('timeUntilStart').get(function() {
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
});

// Instance methods
appointmentSchema.methods.confirm = function(confirmedBy, method = 'platform') {
  this.status = 'confirmed';
  this.confirmation.confirmedAt = new Date();
  this.confirmation.confirmedBy = confirmedBy;
  this.confirmation.confirmationMethod = method;
  return this.save();
};

appointmentSchema.methods.reschedule = function(newStartTime, newEndTime, reason, requestedBy) {
  this.reschedule.originalStartTime = this.startTime;
  this.reschedule.originalEndTime = this.endTime;
  this.reschedule.reason = reason;
  this.reschedule.requestedBy = requestedBy;
  this.reschedule.requestedAt = new Date();
  
  this.startTime = newStartTime;
  this.endTime = newEndTime;
  this.status = 'rescheduled';
  
  if (this.duration) {
    this.duration = Math.round((newEndTime - newStartTime) / (1000 * 60));
  }
  
  return this.save();
};

appointmentSchema.methods.cancel = function(reason, cancelledBy, refundRequired = false, refundAmount = 0) {
  this.status = 'cancelled';
  this.cancellation.reason = reason;
  this.cancellation.cancelledBy = cancelledBy;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.refundRequired = refundRequired;
  this.cancellation.refundAmount = refundAmount;
  return this.save();
};

appointmentSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

appointmentSchema.methods.markNoShow = function() {
  this.status = 'no_show';
  return this.save();
};

appointmentSchema.methods.addAttendee = function(userId, name, email, phone, role) {
  this.attendees.push({
    userId: userId,
    name: name,
    email: email,
    phone: phone,
    role: role
  });
  return this.save();
};

appointmentSchema.methods.removeAttendee = function(userId) {
  this.attendees = this.attendees.filter(attendee => !attendee.userId.equals(userId));
  return this.save();
};

appointmentSchema.methods.addReminder = function(type, scheduledFor) {
  this.reminders.push({
    type: type,
    scheduledFor: scheduledFor,
    status: 'pending'
  });
  return this.save();
};

appointmentSchema.methods.markReminderSent = function(reminderId) {
  const reminder = this.reminders.id(reminderId);
  if (reminder) {
    reminder.status = 'sent';
    reminder.sentAt = new Date();
  }
  return this.save();
};

appointmentSchema.methods.submitFeedback = function(rating, comment, submittedBy) {
  this.feedback = {
    rating: rating,
    comment: comment,
    submittedAt: new Date(),
    submittedBy: submittedBy
  };
  return this.save();
};

// Static methods
appointmentSchema.statics.findUpcoming = function(userId, options = {}) {
  const query = {
    $or: [{ requester: userId }, { host: userId }],
    startTime: { $gt: new Date() },
    status: { $in: ['confirmed', 'pending'] }
  };
  
  if (options.property) {
    query.property = options.property;
  }
  
  return this.find(query)
    .populate('requester', 'firstName lastName email phone')
    .populate('host', 'firstName lastName email phone')
    .populate('property', 'title photos address')
    .sort({ startTime: 1 });
};

appointmentSchema.statics.findConflicts = function(propertyId, startTime, endTime, excludeId = null) {
  const query = {
    property: propertyId,
    status: { $in: ['confirmed', 'pending'] },
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

appointmentSchema.statics.findToday = function(userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  
  return this.find({
    $or: [{ requester: userId }, { host: userId }],
    startTime: { $gte: startOfDay, $lt: endOfDay },
    status: 'confirmed'
  }).populate('property', 'title photos address');
};

// Pre-save middleware
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (this.startTime && this.endTime && !this.duration) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
