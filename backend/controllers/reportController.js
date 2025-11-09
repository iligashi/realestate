const { Report, User, Property } = require('../models');
const { Op } = require('sequelize');

// Create a new report
const createReport = async (req, res) => {
  try {
    const { reportedItemId, reportedItemModel, type, reason, evidence, metadata } = req.body;
    const reporterId = req.user.id;

    // Validate required fields
    if (!reportedItemId || !reportedItemModel || !type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reportedItemId, reportedItemModel, type, and reason are required'
      });
    }
 
    // Validate reportedItemModel
    const validModels = ['property', 'user', 'message', 'review'];
    if (!validModels.includes(reportedItemModel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reportedItemModel. Must be one of: property, user, message, review'
      });
    }

    // Validate report type
    const validTypes = ['spam', 'inappropriate', 'fraud', 'harassment', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type. Must be one of: spam, inappropriate, fraud, harassment, other'
      });
    }

    // Check if the reported item exists
    let reportedItem;
    if (reportedItemModel === 'property') {
      reportedItem = await Property.findByPk(reportedItemId);
    } else if (reportedItemModel === 'user') {
      reportedItem = await User.findByPk(reportedItemId);
    }
    // For messages and reviews, we'll assume they exist for now

    if (!reportedItem && !['message', 'review'].includes(reportedItemModel)) {
      return res.status(404).json({
        success: false,
        message: `${reportedItemModel} not found`
      });
    }

    // Check if user has already reported this item
    const existingReport = await Report.findOne({
      where: {
        reporterId,
        reportedItemId,
        reportedItemModel
      }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this item'
      });
    }

    // Create the report
    const report = await Report.create({
      reporterId,
      reportedItemId,
      reportedItemModel,
      type,
      reason,
      evidence: evidence || null,
      metadata: metadata || null,
      status: 'pending'
    });

    // Fetch the report with reporter information
    const reportWithReporter = await Report.findByPk(report.id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report: reportWithReporter
    });

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report',
      error: error.message
    });
  }
};

// Get reports by reporter (user's own reports)
const getMyReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const reporterId = req.user.id;

    const filter = { reporterId };
    if (status) filter.status = status;

    const reports = await Report.findAll({
      where: filter,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    const total = await Report.count({ where: filter });

    res.json({
      success: true,
      reports,
      pagination: {
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Get reports made against the user (where user is the reported item)
const getReportsAgainstMe = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const userId = req.user.id;

    const filter = { 
      reportedItemId: userId,
      reportedItemModel: 'user'
    };
    if (status) filter.status = status;

    const reports = await Report.findAll({
      where: filter,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    const total = await Report.count({ where: filter });

    res.json({
      success: true,
      reports,
      pagination: {
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get reports against me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports against you',
      error: error.message
    });
  }
};

// Get report by ID
const getReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await Report.findByPk(id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can view this report (either reporter, reported item, or admin)
    const canView = report.reporterId === userId || 
                   report.reportedItemId === userId || 
                   req.user.userType === 'admin';
    
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this report'
      });
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
};

module.exports = {
  createReport,
  getMyReports,
  getReportsAgainstMe,
  getReport
};
