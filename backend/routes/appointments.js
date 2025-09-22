const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createViewingRequest,
  getUserAppointments,
  getUpcomingAppointments,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAppointmentDetails
} = require('../controllers/appointmentController');

// Apply authentication middleware to all routes
router.use(auth);

// Create a new viewing request
router.post('/viewing', createViewingRequest);

// Get appointments for the authenticated user
router.get('/', getUserAppointments);

// Get upcoming appointments
router.get('/upcoming', getUpcomingAppointments);

// Get appointment details
router.get('/:appointmentId', getAppointmentDetails);

// Confirm an appointment
router.patch('/:appointmentId/confirm', confirmAppointment);

// Cancel an appointment
router.patch('/:appointmentId/cancel', cancelAppointment);

// Reschedule an appointment
router.patch('/:appointmentId/reschedule', rescheduleAppointment);

module.exports = router;
