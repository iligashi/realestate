const Appointment = require('../models/Appointment');
const Property = require('../models/Property');
const User = require('../models/User');

// Create a new viewing request
const createViewingRequest = async (req, res) => {
  try {
    const { propertyId, preferredDate, preferredTime, message, contactMethod } = req.body;
    const requesterId = req.user._id;

    // Validate required fields
    if (!propertyId || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: 'Property ID, preferred date, and preferred time are required'
      });
    }

    // Get property and owner
    const property = await Property.findById(propertyId).populate('owner', 'firstName lastName email phone');
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if user is trying to request viewing for their own property
    if (property.owner._id.toString() === requesterId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot request a viewing for your own property'
      });
    }

    // Parse date and time
    const startDateTime = new Date(`${preferredDate}T${preferredTime}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    // Check for conflicts
    const conflicts = await Appointment.findConflicts(propertyId, startDateTime, endDateTime);
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This time slot conflicts with an existing appointment. Please choose a different time.',
        conflicts: conflicts.map(conflict => ({
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          status: conflict.status
        }))
      });
    }

    // Create appointment
    const appointment = new Appointment({
      title: `Property Viewing - ${property.title}`,
      description: message || `Viewing request for ${property.title}`,
      requester: requesterId,
      host: property.owner._id,
      property: propertyId,
      startTime: startDateTime,
      endTime: endDateTime,
      duration: 60, // 1 hour
      type: 'viewing',
      status: 'pending',
      location: {
        address: `${property.address.street}, ${property.address.city}, ${property.address.state}`,
        meetingPoint: 'Property entrance',
        accessInstructions: 'Please contact the property owner for access instructions'
      },
      specialRequirements: contactMethod === 'phone' ? ['Phone contact preferred'] : ['Email contact preferred'],
      priority: 'normal'
    });

    await appointment.save();

    // Populate the appointment for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('requester', 'firstName lastName email phone')
      .populate('host', 'firstName lastName email phone')
      .populate('property', 'title photos address price');

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
    const userId = req.user._id;
    const { status, type, propertyId } = req.query;

    let query = {
      $or: [{ requester: userId }, { host: userId }]
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (propertyId) {
      query.property = propertyId;
    }

    const appointments = await Appointment.find(query)
      .populate('requester', 'firstName lastName email phone')
      .populate('host', 'firstName lastName email phone')
      .populate('property', 'title photos address price')
      .sort({ startTime: 1 });

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
    const userId = req.user._id;
    const { propertyId } = req.query;

    const appointments = await Appointment.findUpcoming(userId, { property: propertyId });

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
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('requester', 'firstName lastName email phone')
      .populate('host', 'firstName lastName email phone')
      .populate('property', 'title photos address');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is the host
    if (appointment.host._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the property owner can confirm appointments'
      });
    }

    await appointment.confirm(userId, 'platform');

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
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is either requester or host
    const isRequester = appointment.requester.toString() === userId.toString();
    const isHost = appointment.host.toString() === userId.toString();

    if (!isRequester && !isHost) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own appointments'
      });
    }

    await appointment.cancel(reason || 'Cancelled by user', userId);

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
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is either requester or host
    const isRequester = appointment.requester.toString() === userId.toString();
    const isHost = appointment.host.toString() === userId.toString();

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
    const conflicts = await Appointment.findConflicts(appointment.property, newStartDateTime, newEndDateTime, appointmentId);
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This time slot conflicts with an existing appointment. Please choose a different time.',
        conflicts: conflicts.map(conflict => ({
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          status: conflict.status
        }))
      });
    }

    await appointment.rescheduleAppointment(newStartDateTime, newEndDateTime, reason, userId);

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('requester', 'firstName lastName email phone')
      .populate('host', 'firstName lastName email phone')
      .populate('property', 'title photos address');

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
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('requester', 'firstName lastName email phone')
      .populate('host', 'firstName lastName email phone')
      .populate('property', 'title photos address price description');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is either requester or host
    const isRequester = appointment.requester._id.toString() === userId.toString();
    const isHost = appointment.host._id.toString() === userId.toString();

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
