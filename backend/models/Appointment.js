const Appointment = (sequelize, DataTypes) => {
  const appointment = sequelize.define('Appointment', {
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
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('viewing', 'inspection', 'meeting', 'open_house', 'virtual_tour', 'closing'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show'),
      defaultValue: 'pending'
    }
  }, {
    tableName: 'appointments',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (record) => {
        if (record.startTime && record.endTime && !record.duration) {
          record.duration = Math.round((record.endTime - record.startTime) / (1000 * 60));
        }
      }
    }
  });

  return appointment;
};

module.exports = Appointment;