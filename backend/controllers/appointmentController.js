const { Appointment, Property, User } = require('../models');

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
    const startDateTime = new Date(`${preferredDate}T${preferredTime}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    // Check for conflicts
    const { Op } = require('sequelize');
    const conflicts = await Appointment.findAll({
      where: {
        property_id: propertyId,
        [Op.or]: [
          {
            start_time: { [Op.between]: [startDateTime, endDateTime] }
          },
          {
            end_time: { [Op.between]: [startDateTime, endDateTime] }
          },
          {
            [Op.and]: [
              { start_time: { [Op.lte]: startDateTime } },
              { end_time: { [Op.gte]: endDateTime } }
            ]
          }
        ],
        status: { [Op.in]: ['scheduled', 'confirmed'] }
      }
    });
    
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This time slot conflicts with an existing appointment. Please choose a different time.',
        conflicts: conflicts.map(conflict => ({
          start_time: conflict.start_time,
          end_time: conflict.end_time,
          status: conflict.status
        }))
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      title: `Property Viewing - ${property.title}`,
      description: message || `Viewing request for ${property.title}`,
      requester_id: requesterId,
      host_id: property.owner.id,
      property_id: propertyId,
      start_time: startDateTime,
      end_time: endDateTime,
      duration: 60, // 1 hour
      type: 'viewing',
      status: 'pending',
      location: {
        address: `${property.address.street}, ${property.address.city}, ${property.address.state}`,
        meeting_point: 'Property entrance',
        access_instructions: 'Please contact the property owner for access instructions'
      },
      special_requirements: contactMethod === 'phone' ? ['Phone contact preferred'] : ['Email contact preferred'],
      priority: 'normal'
    });

    // Get the populated appointment for response
    const populatedAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['title', 'photos', 'address', 'price'] }
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

    const { Op } = require('sequelize');
    let whereClause = {
      [Op.or]: [{ requester_id: userId }, { host_id: userId }]
    };

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (propertyId) {
      whereClause.property_id = propertyId;
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['title', 'photos', 'address', 'price'] }
      ],
      order: [['start_time', 'ASC']]
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

    const { Op } = require('sequelize');
    let whereClause = {
      [Op.or]: [{ requester_id: userId }, { host_id: userId }],
      start_time: { [Op.gte]: new Date() },
      status: { [Op.in]: ['pending', 'confirmed'] }
    };

    if (propertyId) {
      whereClause.property_id = propertyId;
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['title', 'photos', 'address', 'price'] }
      ],
      order: [['start_time', 'ASC']]
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
      status: 'confirmed',
      confirmed_at: new Date(),
      confirmed_by: userId
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
    const isRequester = appointment.requester_id.toString() === userId.toString();
    const isHost = appointment.host_id.toString() === userId.toString();

    if (!isRequester && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own appointments'
      });
    }

    await appointment.update({
      status: 'cancelled',
      cancellation_reason: reason || 'Cancelled by user',
      cancelled_at: new Date(),
      cancelled_by: userId
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
    const isRequester = appointment.requester_id.toString() === userId.toString();
    const isHost = appointment.host_id.toString() === userId.toString();

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
    const { Op } = require('sequelize');
    const conflicts = await Appointment.findAll({
      where: {
        property_id: appointment.property_id,
        id: { [Op.ne]: appointmentId },
        [Op.or]: [
          {
            start_time: { [Op.between]: [newStartDateTime, newEndDateTime] }
          },
          {
            end_time: { [Op.between]: [newStartDateTime, newEndDateTime] }
          },
          {
            [Op.and]: [
              { start_time: { [Op.lte]: newStartDateTime } },
              { end_time: { [Op.gte]: newEndDateTime } }
            ]
          }
        ],
        status: { [Op.in]: ['scheduled', 'confirmed'] }
      }
    });
    
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This time slot conflicts with an existing appointment. Please choose a different time.',
        conflicts: conflicts.map(conflict => ({
          start_time: conflict.start_time,
          end_time: conflict.end_time,
          status: conflict.status
        }))
      });
    }

    await appointment.update({
      start_time: newStartDateTime,
      end_time: newEndDateTime,
      reschedule_reason: reason,
      rescheduled_at: new Date(),
      rescheduled_by: userId,
      status: 'pending' // Reset to pending when rescheduled
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
        { model: Property, as: 'property', attributes: ['title', 'photos', 'address', 'price', 'description'] }
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

module.exports = {
  createViewingRequest,
  getUserAppointments,
  getUpcomingAppointments,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAppointmentDetails
};
