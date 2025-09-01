const mongoose = require('mongoose');

const openHouseSchema = new mongoose.Schema({
  // Basic Information
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Event Details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Scheduling
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 120
  },
  
  // Location Details
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  meetingPoint: String, // Specific meeting location
  parkingInfo: String,
  accessInstructions: String,
  
  // Event Type
  type: {
    type: String,
    enum: ['open-house', 'private-showing', 'virtual-tour', 'auction'],
    default: 'open-house'
  },
  
  // Status & Management
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly'],
    required: false
  },
  
  // Attendees & RSVPs
  maxAttendees: {
    type: Number,
    default: 20
  },
  rsvps: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    phone: String,
    status: {
      type: String,
      enum: ['confirmed', 'maybe', 'declined'],
      default: 'confirmed'
    },
    rsvpDate: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  
  // Virtual Tour (if applicable)
  virtualTour: {
    platform: String, // zoom, google-meet, etc.
    link: String,
    password: String,
    instructions: String
  },
  
  // Marketing & Promotion
  isPublic: {
    type: Boolean,
    default: true
  },
  marketingMaterials: [{
    type: String,
    url: String,
    description: String
  }],
  
  // Follow-up
  followUpNotes: String,
  followUpDate: Date,
  
  // Analytics
  attendance: {
    confirmed: { type: Number, default: 0 },
    attended: { type: Number, default: 0 },
    noShow: { type: Number, default: 0 }
  },
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    sentAt: Date,
    recipient: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
openHouseSchema.index({ property: 1, seller: 1 });
openHouseSchema.index({ seller: 1, startDate: 1 });
openHouseSchema.index({ startDate: 1, endDate: 1 });
openHouseSchema.index({ status: 1, isPublic: 1 });

// Pre-save middleware
openHouseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual fields
openHouseSchema.virtual('isUpcoming').get(function() {
  return this.startDate > new Date() && this.status === 'scheduled';
});

openHouseSchema.virtual('isActive').get(function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate && this.status === 'active';
});

openHouseSchema.virtual('isPast').get(function() {
  return this.endDate < new Date() || this.status === 'completed';
});

// Instance methods
openHouseSchema.methods.addRSVP = function(userId, userInfo, status = 'confirmed', notes = '') {
  const existingRSVP = this.rsvps.find(rsvp => rsvp.user.toString() === userId.toString());
  
  if (existingRSVP) {
    existingRSVP.status = status;
    existingRSVP.notes = notes;
    existingRSVP.rsvpDate = new Date();
  } else {
    this.rsvps.push({
      user: userId,
      name: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone,
      status,
      notes,
      rsvpDate: new Date()
    });
  }
  
  this.attendance.confirmed = this.rsvps.filter(rsvp => rsvp.status === 'confirmed').length;
  return this.save();
};

openHouseSchema.methods.markAttendance = function(userId, attended = true) {
  const rsvp = this.rsvps.find(rsvp => rsvp.user.toString() === userId.toString());
  if (rsvp) {
    if (attended) {
      this.attendance.attended += 1;
    } else {
      this.attendance.noShow += 1;
    }
  }
  return this.save();
};

openHouseSchema.methods.cancel = function(reason = '') {
  this.status = 'cancelled';
  this.followUpNotes = reason;
  return this.save();
};

// Static methods
openHouseSchema.statics.getUpcomingBySeller = function(sellerId) {
  return this.find({
    seller: sellerId,
    startDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'active'] }
  })
  .populate('property', 'title address price photos')
  .sort({ startDate: 1 });
};

openHouseSchema.statics.getPastBySeller = function(sellerId) {
  return this.find({
    seller: sellerId,
    $or: [
      { endDate: { $lt: new Date() } },
      { status: 'completed' }
    ]
  })
  .populate('property', 'title address price photos')
  .sort({ endDate: -1 });
};

module.exports = mongoose.model('OpenHouse', openHouseSchema);
