const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const Property = require('../models/Property');
const Message = require('../models/Message');
const logger = require('../utils/logger');

// Map the lowercase item types the client sends to Mongoose model names
const ITEM_MODELS = {
  property: { name: 'Property', model: Property },
  user: { name: 'User', model: User },
  message: { name: 'Message', model: Message }
};

const REPORT_TYPES = ['spam', 'inappropriate', 'fake', 'harassment', 'copyright', 'fraud', 'other'];
const REPORTER_FIELDS = 'firstName lastName email';

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const paginatedReports = async (filter, query) => {
  const { page, limit, skip } = parsePagination(query);
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reportedBy', REPORTER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filter)
  ]);

  return {
    success: true,
    reports,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit
    }
  };
};

// POST /api/reports
const createReport = async (req, res) => {
  try {
    const { reportedItemId, reportedItemModel, type, reason, evidence, metadata } = req.body;

    if (!reportedItemId || !reportedItemModel || !type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'reportedItemId, reportedItemModel, type and reason are required'
      });
    }

    const target = ITEM_MODELS[String(reportedItemModel).toLowerCase()];
    if (!target) {
      return res.status(400).json({
        success: false,
        message: `Invalid reportedItemModel. Must be one of: ${Object.keys(ITEM_MODELS).join(', ')}`
      });
    }

    if (!REPORT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid report type. Must be one of: ${REPORT_TYPES.join(', ')}`
      });
    }

    if (!mongoose.isValidObjectId(reportedItemId)) {
      return res.status(400).json({ success: false, message: 'Invalid reportedItemId' });
    }

    const exists = await target.model.exists({ _id: reportedItemId });
    if (!exists) {
      return res.status(404).json({ success: false, message: `${target.name} not found` });
    }

    const duplicate = await Report.exists({
      reportedBy: req.user._id,
      reportedItem: reportedItemId,
      reportedItemModel: target.name
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'You have already reported this item' });
    }

    const report = await Report.create({
      reportedBy: req.user._id,
      reportedItem: reportedItemId,
      reportedItemModel: target.name,
      type,
      reason,
      ...(Array.isArray(evidence) && { evidence }),
      ...(metadata && typeof metadata === 'object' && { metadata })
    });

    await report.populate('reportedBy', REPORTER_FIELDS);

    res.status(201).json({ success: true, message: 'Report submitted successfully', report });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    logger.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Failed to create report' });
  }
};

// GET /api/reports/my-reports
const getMyReports = async (req, res) => {
  try {
    const filter = { reportedBy: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    res.json(await paginatedReports(filter, req.query));
  } catch (error) {
    logger.error('Get my reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};

// GET /api/reports/against-me
const getReportsAgainstMe = async (req, res) => {
  try {
    const filter = { reportedItem: req.user._id, reportedItemModel: 'User' };
    if (req.query.status) filter.status = req.query.status;
    res.json(await paginatedReports(filter, req.query));
  } catch (error) {
    logger.error('Get reports against me error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports against you' });
  }
};

// GET /api/reports/:id
const getReport = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const report = await Report.findById(req.params.id).populate('reportedBy', REPORTER_FIELDS);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const userId = String(req.user._id);
    const canView =
      String(report.reportedBy?._id || report.reportedBy) === userId ||
      String(report.reportedItem) === userId ||
      req.user.userType === 'admin';

    if (!canView) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this report' });
    }

    res.json({ success: true, report });
  } catch (error) {
    logger.error('Get report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch report' });
  }
};

module.exports = {
  createReport,
  getMyReports,
  getReportsAgainstMe,
  getReport
};
