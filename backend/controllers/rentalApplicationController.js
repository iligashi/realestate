const { RentalApplication, Property, User, Notification } = require('../models');
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
    const userId = Number(req.user.id);

    // Check if property exists and is for rent
    const property = await Property.findByPk(propertyId, {
      include: [{ model: User, as: 'owner' }]
    });
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
      where: {
        propertyId: propertyId,
        applicantId: userId
      }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this property'
      });
    }

    // Create the application
    const applicationData = {
      propertyId: propertyId,
      applicantId: userId,
      landlordId: property.owner.id,
      personalInfo: req.body.personalInfo,
      employment: req.body.employment,
      rentalInfo: req.body.rentalInfo,
      financialInfo: req.body.financialInfo,
      additionalInfo: req.body.additionalInfo,
      documents: req.body.documents || []
    };

    const application = await RentalApplication.create(applicationData);

    // Get the populated application with related data
    const populatedApplication = await RentalApplication.findByPk(application.id, {
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'propertyType'] },
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    // Create notification for landlord
    const notification = await Notification.create({
      recipientId: property.owner.id,
      type: 'rental_application',
      title: 'New Rental Application',
      content: `${req.body.personalInfo.firstName} ${req.body.personalInfo.lastName} has applied for your property: ${property.title}`,
      data: {
        applicationId: application.id,
        propertyId: propertyId,
        applicantId: userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Rental application submitted successfully',
      application: populatedApplication
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

    const whereClause = { landlord_id: userId };
    if (status) {
      whereClause.status = status;
    }

    const applications = await RentalApplication.findAll({
      where: whereClause,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'propertyType', 'photos'] },
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture'] }
      ],
      order: [['application_date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await RentalApplication.count({ where: whereClause });

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

    const whereClause = { applicant_id: userId };
    if (status) {
      whereClause.status = status;
    }

    const applications = await RentalApplication.findAll({
      where: whereClause,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'propertyType', 'photos'] },
        { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }
      ],
      order: [['application_date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Convert to JSON to trigger the model's JSON parsing
    const parsedApplications = applications.map(app => {
      const appData = app.toJSON();
      
      // Parse JSON fields for property
      if (appData.property) {
        if (typeof appData.property.address === 'string') {
          try {
            appData.property.address = JSON.parse(appData.property.address);
          } catch (e) {
            appData.property.address = {};
          }
        }
        if (typeof appData.property.photos === 'string') {
          try {
            appData.property.photos = JSON.parse(appData.property.photos);
          } catch (e) {
            appData.property.photos = [];
          }
        }
      }
      
      return appData;
    });

    const total = await RentalApplication.count({ where: whereClause });

    res.json({
      success: true,
      applications: parsedApplications,
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

    const application = await RentalApplication.findByPk(applicationId, {
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'propertyType', 'photos', 'rentalDetails'] },
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture'] },
        { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user has permission to view this application
    const applicantId = Number(application.applicantId || application.applicant_id || (application.applicant && application.applicant.id));
    const landlordId = Number(application.landlordId || application.landlord_id || (application.landlord && application.landlord.id));

    if (applicantId !== userId && landlordId !== userId) {
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

    const application = await RentalApplication.findByPk(applicationId, {
      include: [
        { model: User, as: 'applicant' },
        { model: User, as: 'landlord' },
        { model: Property, as: 'property' }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user is the landlord
    if (application.landlord.id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the landlord can update application status'
      });
    }

    // Update application
    const decisionPayload = {
      status,
      decisionDate: new Date().toISOString(),
      decisionReason: reason || null,
      decisionNotes: notes || null,
      decidedBy: {
        id: userId,
        role: 'landlord',
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || null
      }
    };

    await application.update({
      status,
      decision: decisionPayload
    });

    await application.reload({
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture'] },
        { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'propertyType', 'photos'] }
      ]
    });

    // Create notification for applicant
    const notification = await Notification.create({
      recipientId: application.applicant.id,
      type: 'application_decision',
      title: `Application ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      content: `Your rental application for ${application.property?.title || 'the property'} has been ${status}.`,
      data: {
        application_id: application.id,
        property_id: application.property?.id || application.propertyId,
        status
      }
    });

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

// Applicant responds to application (approve/decline)
const applicantUpdateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = Number(req.user.id);
    const { status, reason, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    const application = await RentalApplication.findByPk(applicationId, {
      include: [
        { model: User, as: 'applicant' },
        { model: User, as: 'landlord' },
        { model: Property, as: 'property' }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const applicantId = Number(application.applicantId || application.applicant_id || (application.applicant && application.applicant.id));
    if (applicantId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the applicant can perform this action'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending applications can be approved or rejected by the applicant'
      });
    }

    const decisionPayload = {
      status,
      decisionDate: new Date().toISOString(),
      decisionReason: reason || null,
      decisionNotes: notes || null,
      decidedBy: {
        id: userId,
        role: 'applicant',
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || null
      }
    };

    await application.update({
      status,
      decision: decisionPayload
    });

    await application.reload({
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture'] },
        { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'propertyType', 'photos'] }
      ]
    });

    // Notify landlord about applicant decision
    const landlordId = Number(application.landlordId || application.landlord_id || (application.landlord && application.landlord.id));
    if (landlordId) {
      await Notification.create({
        recipientId: landlordId,
        type: 'application_response',
        title: `Application ${status === 'approved' ? 'Accepted' : 'Declined'}`,
        content: `${req.user.firstName || req.user.lastName ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'The applicant'} has ${status === 'approved' ? 'accepted' : 'declined'} the rental application for ${application.property?.title || 'your property'}.`,
        data: {
          application_id: application.id,
          property_id: application.property?.id || application.propertyId,
          status
        }
      });
    }

    res.json({
      success: true,
      message: `Application ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      application
    });
  } catch (error) {
    console.error('Applicant update application status error:', error);
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

    const application = await RentalApplication.findByPk(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user has permission to add messages
    if (application.applicant_id.toString() !== userId && application.landlord_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const isFromLandlord = application.landlord_id.toString() === userId;

    // Get current messages and add new one
    const currentMessages = application.messages || [];
    currentMessages.push({
      sender: userId,
      message,
      isFromLandlord,
      timestamp: new Date()
    });

    await application.update({
      messages: currentMessages
    });

    // Emit WebSocket event for real-time notification
    if (global.socketServer) {
      const recipientId = isFromLandlord ? application.applicant_id : application.landlord_id;
      global.socketServer.emitNewMessage({
        message_id: application.id,
        renter: application.applicant_id,
        landlord: application.landlord_id,
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
      application: await RentalApplication.findByPk(applicationId, {
        include: [
          { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'landlord', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: Property, as: 'property', attributes: ['title', 'address'] }
        ]
      })
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

    const application = await RentalApplication.findByPk(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user is the applicant
    if (application.applicant_id.toString() !== userId) {
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

    await application.update({
      status: 'withdrawn',
      withdrawn_at: new Date()
    });

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
  applicantUpdateApplicationStatus,
  addApplicationMessage,
  withdrawApplication
};
