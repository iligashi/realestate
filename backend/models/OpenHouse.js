module.exports = (sequelize, DataTypes) => {
  const OpenHouse = sequelize.define('OpenHouse', {
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
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'seller_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date'
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 120,
      comment: 'Duration in minutes'
    },
    // Address (stored as JSON)
    address: {
      type: DataTypes.JSON,
      allowNull: true
    },
    meetingPoint: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'meeting_point'
    },
    parkingInfo: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'parking_info'
    },
    accessInstructions: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'access_instructions'
    },
    type: {
      type: DataTypes.ENUM('open-house', 'private-showing', 'virtual-tour', 'auction'),
      defaultValue: 'open-house'
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'active', 'completed', 'cancelled', 'postponed'),
      defaultValue: 'scheduled'
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_recurring'
    },
    recurringPattern: {
      type: DataTypes.ENUM('weekly', 'bi-weekly', 'monthly'),
      allowNull: true,
      field: 'recurring_pattern'
    },
    maxAttendees: {
      type: DataTypes.INTEGER,
      defaultValue: 20,
      field: 'max_attendees'
    },
    // RSVPs (stored as JSON)
    rsvps: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Virtual Tour (stored as JSON)
    virtualTour: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'virtual_tour'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_public'
    },
    marketingMaterials: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'marketing_materials'
    },
    followUpNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'follow_up_notes'
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'follow_up_date'
    },
    // Analytics (stored as JSON)
    attendance: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Reminders (stored as JSON)
    reminders: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'open_houses',
    timestamps: true,
    underscored: true,
    indexes: [
      // Temporarily removed complex indexes to avoid key length issues
    ]
  });

  // Instance methods
  OpenHouse.prototype.isUpcoming = function() {
    return this.startDate > new Date() && this.status === 'scheduled';
  };

  OpenHouse.prototype.isActive = function() {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate && this.status === 'active';
  };

  OpenHouse.prototype.isPast = function() {
    return this.endDate < new Date() || this.status === 'completed';
  };

  OpenHouse.prototype.addRSVP = async function(userId, userInfo, status = 'confirmed', notes = '') {
    const rsvps = this.rsvps || [];
    const existingRSVP = rsvps.find(rsvp => rsvp.user === userId);
    
    if (existingRSVP) {
      existingRSVP.status = status;
      existingRSVP.notes = notes;
      existingRSVP.rsvpDate = new Date();
    } else {
      rsvps.push({
        user: userId,
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        status,
        notes,
        rsvpDate: new Date()
      });
    }
    
    this.rsvps = rsvps;
    
    // Update attendance count
    const attendance = this.attendance || { confirmed: 0, attended: 0, noShow: 0 };
    attendance.confirmed = rsvps.filter(rsvp => rsvp.status === 'confirmed').length;
    this.attendance = attendance;
    
    return this.save();
  };

  OpenHouse.prototype.markAttendance = async function(userId, attended = true) {
    const rsvps = this.rsvps || [];
    const rsvp = rsvps.find(rsvp => rsvp.user === userId);
    
    if (rsvp) {
      const attendance = this.attendance || { confirmed: 0, attended: 0, noShow: 0 };
      if (attended) {
        attendance.attended += 1;
      } else {
        attendance.noShow += 1;
      }
      this.attendance = attendance;
    }
    
    return this.save();
  };

  OpenHouse.prototype.cancel = async function(reason = '') {
    this.status = 'cancelled';
    this.followUpNotes = reason;
    return this.save();
  };

  // Static methods
  OpenHouse.getUpcomingBySeller = function(sellerId) {
    return this.findAll({
      where: {
        sellerId: sellerId,
        startDate: { [sequelize.Op.gte]: new Date() },
        status: { [sequelize.Op.in]: ['scheduled', 'active'] }
      },
      order: [['start_date', 'ASC']]
    });
  };

  OpenHouse.getPastBySeller = function(sellerId) {
    return this.findAll({
      where: {
        sellerId: sellerId,
        [sequelize.Op.or]: [
          { endDate: { [sequelize.Op.lt]: new Date() } },
          { status: 'completed' }
        ]
      },
      order: [['end_date', 'DESC']]
    });
  };

  // Virtual fields (computed properties)
  OpenHouse.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    values.isUpcoming = this.isUpcoming();
    values.isActive = this.isActive();
    values.isPast = this.isPast();
    return values;
  };

  return OpenHouse;
};