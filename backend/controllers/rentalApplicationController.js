const RentalApplication = require('../models/RentalApplication');
const Property = require('../models/Property');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// Create a new rental application
const createRentalApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { propertyId } = req.params;
    const userId = req.user.id;

    // Check if property exists and is for rent
    const property = await Property.findById(propertyId).populate('owner');
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.listingType !== 'rental') {
      return res.status(400).json({
        success: false,
        message: 'This property is not available for rent'
      });
    }

    // Check if user already applied for this property
    const existingApplication = await RentalApplication.findOne({
      property: propertyId,
      applicant: userId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this property'
      });
    }

    // Create the application
    const applicationData = {
      property: propertyId,
      applicant: userId,
      landlord: property.owner._id,
      personalInfo: req.body.personalInfo,
      employment: req.body.employment,
      rentalInfo: req.body.rentalInfo,
      financialInfo: req.body.financialInfo,
      additionalInfo: req.body.additionalInfo,
      documents: req.body.documents || []
    };

    const application = new RentalApplication(applicationData);
    await application.save();

    // Populate the application with related data
    await application.populate([
      { path: 'property', select: 'title address propertyType' },
      { path: 'applicant', select: 'firstName lastName email' },
      { path: 'landlord', select: 'firstName lastName email' }
    ]);

    // Create notification for landlord
    const notification = new Notification({
      user: property.owner._id,
      type: 'rental_application',
      title: 'New Rental Application',
      message: `${req.body.personalInfo.firstName} ${req.body.personalInfo.lastName} has applied for your property: ${property.title}`,
      data: {
        applicationId: application._id,
        propertyId: propertyId,
        applicantId: userId
      }
    });
    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Rental application submitted successfully',
      application
    });

  } catch (error) {
    console.error('Error creating rental application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get applications for a landlord
const getLandlordApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { landlord: userId };
    if (status) {
      query.status = status;
    }

    const applications = await RentalApplication.find(query)
      .populate([
        { path: 'property', select: 'title address propertyType photos' },
        { path: 'applicant', select: 'firstName lastName email phone profilePicture' }
      ])
      .sort({ applicationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RentalApplication.countDocuments(query);

    res.json({
      success: true,
      applications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching landlord applications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get applications for an applicant
const getApplicantApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { applicant: userId };
    if (status) {
      query.status = status;
    }

    const applications = await RentalApplication.find(query)
      .populate([
        { path: 'property', select: 'title address propertyType photos' },
        { path: 'landlord', select: 'firstName lastName email phone' }
      ])
      .sort({ applicationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RentalApplication.countDocuments(query);

    res.json({
      success: true,
      applications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching applicant applications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get a specific application
const getApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    const application = await RentalApplication.findById(applicationId)
      .populate([
        { path: 'property', select: 'title address propertyType photos rentalDetails' },
        { path: 'applicant', select: 'firstName lastName email phone profilePicture' },
        { path: 'landlord', select: 'firstName lastName email phone' }
      ]);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user has permission to view this application
    if (application.applicant._id.toString() !== userId && application.landlord._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      application
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update application status (approve/reject)
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;
    const { status, reason, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    const application = await RentalApplication.findById(applicationId)
      .populate('applicant landlord property');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user is the landlord
    if (application.landlord._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the landlord can update application status'
      });
    }

    // Update application
    application.status = status;
    application.decision = {
      status,
      decisionDate: new Date(),
      decisionReason: reason,
      decisionNotes: notes,
      decidedBy: userId
    };

    await application.save();

    // Create notification for applicant
    const notification = new Notification({
      user: application.applicant._id,
      type: 'application_decision',
      title: `Application ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your rental application for ${application.property.title} has been ${status}.`,
      data: {
        applicationId: application._id,
        propertyId: application.property._id,
        status
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      application
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add message to application
const addApplicationMessage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    const application = await RentalApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user has permission to add messages
    if (application.applicant.toString() !== userId && application.landlord.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const isFromLandlord = application.landlord.toString() === userId;

    application.messages.push({
      sender: userId,
      message,
      isFromLandlord
    });

    await application.save();

    // Emit WebSocket event for real-time notification
    if (global.socketServer) {
      const recipientId = isFromLandlord ? application.applicant : application.landlord;
      global.socketServer.emitNewMessage({
        messageId: application._id,
        renter: application.applicant,
        landlord: application.landlord,
        message: message,
        sender: {
          id: userId,
          name: req.user.name,
          email: req.user.email
        }
      });
    }

    res.json({
      success: true,
      message: 'Message added successfully',
      application: await RentalApplication.findById(applicationId)
        .populate('applicant', 'name email')
        .populate('landlord', 'name email')
        .populate('property', 'title address')
    });

  } catch (error) {
    console.error('Error adding application message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Withdraw application
const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    const application = await RentalApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user is the applicant
    if (application.applicant.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the applicant can withdraw the application'
      });
    }

    // Check if application can be withdrawn
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw application that has been processed'
      });
    }

    application.status = 'withdrawn';
    await application.save();

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createRentalApplication,
  getLandlordApplications,
  getApplicantApplications,
  getApplication,
  updateApplicationStatus,
  addApplicationMessage,
  withdrawApplication
};
