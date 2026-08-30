const { Appointment, Property, User } = require('../models');
const { Op } = require('sequelize');

const normalizeJSONField = (value, fallback = null) => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }
  return value;
};

const buildLocationSummary = (address) => {
  const normalized = normalizeJSONField(address, {});
  const parts = [
    normalized?.street,
    normalized?.city,
    normalized?.state,
    normalized?.zipCode,
    normalized?.country
  ].filter(Boolean);

  if (parts.length === 0) {
    return 'Address provided after confirmation';
  }

  return parts.join(', ');
};

const normalizeTimeString = (timeStr) => {
  if (!timeStr) return null;

  const trimmed = timeStr.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3].toUpperCase();

  hours = hours % 12;
  if (meridiem === 'PM') {
    hours += 12;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
};

// Create a new viewing request
const createViewingRequest = async (req, res) => {
  try {
    const { propertyId, preferredDate, preferredTime, message, contactMethod } = req.body;
    const requesterId = req.user.id;

    // Validate required fields
    if (!propertyId || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: 'Property ID, preferred date, and preferred time are required'
      });
    }

    // Get property and owner
    const property = await Property.findByPk(propertyId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }]
    });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if user is trying to request viewing for their own property
    if (property.owner.id.toString() === requesterId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request a viewing for your own property'
      });
    }

    // Parse date and time
    const normalizedTime = normalizeTimeString(preferredTime);
    if (!normalizedTime) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Please select a valid time slot.'
      });
    }

    const startDateTime = new Date(`${preferredDate}T${normalizedTime}`);
    if (Number.isNaN(startDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date or time selection. Please try again.'
      });
    }

    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    // Check for conflicts
    const conflicts = await Appointment.findAll({
      where: {
        propertyId,
        [Op.or]: [
          {
            startTime: { [Op.between]: [startDateTime, endDateTime] }
          },
          {
            endTime: { [Op.between]: [startDateTime, endDateTime] }
          },
          {
            [Op.and]: [
              { startTime: { [Op.lte]: startDateTime } },
              { endTime: { [Op.gte]: endDateTime } }
            ]
          }
        ],
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });
    
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This time slot conflicts with an existing appointment. Please choose a different time.',
        conflicts: conflicts.map(conflict => ({
          start_time: conflict.startTime,
          end_time: conflict.endTime,
          status: conflict.status
        }))
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      title: `Property Viewing - ${property.title}`,
      description: message || `Viewing request for ${property.title}`,
      requesterId: requesterId,
      hostId: property.owner.id,
      propertyId,
      startTime: startDateTime,
      endTime: endDateTime,
      duration: 60, // 1 hour
      type: 'viewing',
      status: 'pending'
    });

    // Get the populated appointment for response
    const populatedAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['id', 'title', 'photos', 'address', 'price'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Viewing request sent successfully',
      appointment: populatedAppointment
    });

  } catch (error) {
    console.error('Create viewing request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create viewing request',
      error: error.message
    });
  }
};

// Get appointments for a user
const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type, propertyId } = req.query;

    let whereClause = {
      [Op.or]: [{ requesterId: userId }, { hostId: userId }]
    };

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['id', 'title', 'photos', 'address', 'price'] }
      ],
      order: [['startTime', 'ASC']]
    });

    res.json({
      success: true,
      appointments
    });

  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

// Get upcoming appointments
const getUpcomingAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.query;

    let whereClause = {
      [Op.or]: [{ requesterId: userId }, { hostId: userId }],
      startTime: { [Op.gte]: new Date() },
      status: { [Op.in]: ['pending', 'confirmed'] }
    };

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['id', 'title', 'photos', 'address', 'price'] }
      ],
      order: [['startTime', 'ASC']]
    });

    res.json({
      success: true,
      appointments
    });

  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming appointments',
      error: error.message
    });
  }
};

// Confirm an appointment
const confirmAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['title', 'photos', 'address'] }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is the host
    if (appointment.host.id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the property owner can confirm appointments'
      });
    }

    await appointment.update({
      status: 'confirmed'
    });

    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      appointment
    });

  } catch (error) {
    console.error('Confirm appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm appointment',
      error: error.message
    });
  }
};

// Cancel an appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const appointment = await Appointment.findByPk(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is either requester or host
    const isRequester = appointment.requesterId.toString() === userId.toString();
    const isHost = appointment.hostId.toString() === userId.toString();

    if (!isRequester && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own appointments'
      });
    }

    await appointment.update({
      status: 'cancelled'
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};

// Reschedule an appointment
const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newDate, newTime, reason } = req.body;
    const userId = req.user.id;

    const appointment = await Appointment.findByPk(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is either requester or host
    const isRequester = appointment.requesterId.toString() === userId.toString();
    const isHost = appointment.hostId.toString() === userId.toString();

    if (!isRequester && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'You can only reschedule your own appointments'
      });
    }

    // Parse new date and time
    const newStartDateTime = new Date(`${newDate}T${newTime}`);
    const newEndDateTime = new Date(newStartDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    // Check for conflicts
    const conflicts = await Appointment.findAll({
      where: {
        propertyId: appointment.propertyId,
        id: { [Op.ne]: appointmentId },
        [Op.or]: [
          {
            startTime: { [Op.between]: [newStartDateTime, newEndDateTime] }
          },
          {
            endTime: { [Op.between]: [newStartDateTime, newEndDateTime] }
          },
          {
            [Op.and]: [
              { startTime: { [Op.lte]: newStartDateTime } },
              { endTime: { [Op.gte]: newEndDateTime } }
            ]
          }
        ],
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });
    
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This time slot conflicts with an existing appointment. Please choose a different time.',
        conflicts: conflicts.map(conflict => ({
          start_time: conflict.startTime,
          end_time: conflict.endTime,
          status: conflict.status
        }))
      });
    }

    await appointment.update({
      startTime: newStartDateTime,
      endTime: newEndDateTime,
      status: 'pending'
    });

    const populatedAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['title', 'photos', 'address'] }
      ]
    });

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment: populatedAppointment
    });

  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment',
      error: error.message
    });
  }
};

// Get appointment details
const getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['id', 'title', 'photos', 'address'] }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is either requester or host
    const isRequester = appointment.requester.id.toString() === userId.toString();
    const isHost = appointment.host.id.toString() === userId.toString();

    if (!isRequester && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own appointments'
      });
    }

    res.json({
      success: true,
      appointment
    });

  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment details',
      error: error.message
    });
  }
};

// Complete an appointment
const completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['title', 'photos', 'address'] }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const isParticipant =
      appointment.requesterId.toString() === userId.toString() ||
      appointment.hostId.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete appointments you are involved in'
      });
    }

    await appointment.update({
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Appointment marked as completed',
      appointment
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete appointment',
      error: error.message
    });
  }
};

module.exports = {
  createViewingRequest,
  getUserAppointments,
  getUpcomingAppointments,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  getAppointmentDetails
};
