const User = require('../models/User');
const Client = require('../models/Client');
const Commission = require('../models/Commission');
const Lead = require('../models/Lead');
const MarketAnalysis = require('../models/MarketAnalysis');
const Property = require('../models/Property');
const Review = require('../models/Review');

// Get Agent Dashboard Data
const getAgentDashboard = async (req, res) => {
  try {
    const agentId = req.user._id;
    
    // Get basic agent info
    const agent = await User.findById(agentId).select('-password');
    
    // Get dashboard statistics
    const [
      totalClients,
      activeClients,
      totalLeads,
      activeLeads,
      totalCommissions,
      pendingCommissions,
      totalProperties,
      activeListings,
      recentReviews
    ] = await Promise.all([
      Client.countDocuments({ agentId }),
      Client.countDocuments({ agentId, status: { $in: ['lead', 'prospect', 'active', 'under_contract'] } }),
      Lead.countDocuments({ agentId }),
      Lead.countDocuments({ agentId, status: { $in: ['new', 'contacted', 'qualified', 'nurturing'] } }),
      Commission.aggregate([
        { $match: { agentId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]),
      Commission.aggregate([
        { $match: { agentId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]),
      Property.countDocuments({ agentId }),
      Property.countDocuments({ agentId, status: 'active' }),
      Review.find({ agentId }).populate('reviewerId', 'firstName lastName').sort({ createdAt: -1 }).limit(5)
    ]);
    
    // Get recent activities
    const recentActivities = await Promise.all([
      Client.find({ agentId }).sort({ lastContact: -1 }).limit(5).select('firstName lastName status lastContact'),
      Lead.find({ agentId }).sort({ lastContact: -1 }).limit(5).select('firstName lastName status lastContact'),
      Commission.find({ agentId }).sort({ createdAt: -1 }).limit(5).select('commissionAmount status propertyId')
    ]);
    
    // Get monthly commission data for chart
    const monthlyCommissions = await Commission.aggregate([
      {
        $match: {
          agentId,
          status: 'paid',
          paymentDate: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          total: { $sum: '$commissionAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      agent,
      stats: {
        totalClients,
        activeClients,
        totalLeads,
        activeLeads,
        totalCommissions: totalCommissions[0]?.total || 0,
        pendingCommissions: pendingCommissions[0]?.total || 0,
        totalProperties,
        activeListings,
        averageRating: agent.agent?.rating?.average || 0,
        totalReviews: agent.agent?.rating?.count || 0
      },
      recentActivities: {
        clients: recentActivities[0],
        leads: recentActivities[1],
        commissions: recentActivities[2]
      },
      monthlyCommissions,
      recentReviews
    });
  } catch (error) {
    console.error('Get agent dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
};

// Client Management
const getClients = async (req, res) => {
  try {
    const agentId = req.user._id;
    const { status, page = 1, limit = 10, search } = req.query;
    
    const query = { agentId };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const clients = await Client.find(query)
      .sort({ lastContact: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('currentProperty', 'title price address')
      .populate('interestedProperties.property', 'title price address');
    
    const total = await Client.countDocuments(query);
    
    res.json({
      clients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients.' });
  }
};

const getClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const agentId = req.user._id;
    
    const client = await Client.findOne({ _id: clientId, agentId })
      .populate('currentProperty')
      .populate('interestedProperties.property')
      .populate('communicationHistory.agentId', 'firstName lastName');
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }
    
    res.json({ client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client.' });
  }
};

const createClient = async (req, res) => {
  try {
    const agentId = req.user._id;
    const clientData = { ...req.body, agentId };
    
    const client = new Client(clientData);
    await client.save();
    
    // Update agent's client count
    await User.findByIdAndUpdate(agentId, {
      $inc: { 'agent.clientCount': 1 }
    });
    
    res.status(201).json({
      message: 'Client created successfully',
      client
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client.' });
  }
};

const updateClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const agentId = req.user._id;
    
    const client = await Client.findOneAndUpdate(
      { _id: clientId, agentId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }
    
    res.json({
      message: 'Client updated successfully',
      client
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client.' });
  }
};

const addClientInteraction = async (req, res) => {
  try {
    const { clientId } = req.params;
    const agentId = req.user._id;
    const { type, subject, notes, nextAction, nextActionDate } = req.body;
    
    const interaction = {
      type,
      subject,
      notes,
      nextAction,
      nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
      agentId,
      date: new Date()
    };
    
    const client = await Client.findOneAndUpdate(
      { _id: clientId, agentId },
      { 
        $push: { communicationHistory: interaction },
        $set: { lastContact: new Date() }
      },
      { new: true }
    );
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }
    
    res.json({
      message: 'Interaction added successfully',
      client
    });
  } catch (error) {
    console.error('Add client interaction error:', error);
    res.status(500).json({ error: 'Failed to add interaction.' });
  }
};

// Lead Management
const getLeads = async (req, res) => {
  try {
    const agentId = req.user._id;
    const { status, quality, source, page = 1, limit = 10, search } = req.query;
    
    const query = { agentId };
    if (status) query.status = status;
    if (quality) query.quality = quality;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const leads = await Lead.find(query)
      .sort({ score: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Lead.countDocuments(query);
    
    res.json({
      leads,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads.' });
  }
};

const getLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const agentId = req.user._id;
    
    const lead = await Lead.findOne({ _id: leadId, agentId })
      .populate('clientId')
      .populate('interactions.agentId', 'firstName lastName');
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    
    res.json({ lead });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Failed to fetch lead.' });
  }
};

const createLead = async (req, res) => {
  try {
    const agentId = req.user._id;
    const leadData = { ...req.body, agentId };
    
    const lead = new Lead(leadData);
    await lead.save();
    
    res.status(201).json({
      message: 'Lead created successfully',
      lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead.' });
  }
};

const updateLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const agentId = req.user._id;
    
    const lead = await Lead.findOneAndUpdate(
      { _id: leadId, agentId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    
    res.json({
      message: 'Lead updated successfully',
      lead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead.' });
  }
};

const addLeadInteraction = async (req, res) => {
  try {
    const { leadId } = req.params;
    const agentId = req.user._id;
    const { type, subject, notes, outcome, nextAction, nextActionDate } = req.body;
    
    const interaction = {
      type,
      subject,
      notes,
      outcome,
      nextAction,
      nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
      agentId,
      date: new Date()
    };
    
    const lead = await Lead.findOneAndUpdate(
      { _id: leadId, agentId },
      { 
        $push: { interactions: interaction },
        $set: { lastContact: new Date() }
      },
      { new: true }
    );
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    
    res.json({
      message: 'Interaction added successfully',
      lead
    });
  } catch (error) {
    console.error('Add lead interaction error:', error);
    res.status(500).json({ error: 'Failed to add interaction.' });
  }
};

const convertLeadToClient = async (req, res) => {
  try {
    const { leadId } = req.params;
    const agentId = req.user._id;
    const { clientData } = req.body;
    
    // Create new client
    const client = new Client({
      ...clientData,
      agentId,
      leadSource: 'converted_lead'
    });
    await client.save();
    
    // Update lead
    const lead = await Lead.findOneAndUpdate(
      { _id: leadId, agentId },
      { 
        $set: { 
          convertedToClient: true,
          clientId: client._id,
          conversionDate: new Date(),
          status: 'converted'
        }
      },
      { new: true }
    );
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    
    // Update agent's client count
    await User.findByIdAndUpdate(agentId, {
      $inc: { 'agent.clientCount': 1 }
    });
    
    res.json({
      message: 'Lead converted to client successfully',
      client,
      lead
    });
  } catch (error) {
    console.error('Convert lead to client error:', error);
    res.status(500).json({ error: 'Failed to convert lead.' });
  }
};

// Commission Management
const getCommissions = async (req, res) => {
  try {
    const agentId = req.user._id;
    const { status, year, page = 1, limit = 10 } = req.query;
    
    const query = { agentId };
    if (status) query.status = status;
    if (year) query.taxYear = parseInt(year);
    
    const commissions = await Commission.find(query)
      .populate('propertyId', 'title address price')
      .populate('clientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Commission.countDocuments(query);
    
    // Get summary statistics
    const summary = await Commission.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$commissionAmount' },
          paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0] } },
          pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0] } },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      commissions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      summary: summary[0] || { totalAmount: 0, paidAmount: 0, pendingAmount: 0, count: 0 }
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({ error: 'Failed to fetch commissions.' });
  }
};

const createCommission = async (req, res) => {
  try {
    const agentId = req.user._id;
    const commissionData = { ...req.body, agentId };
    
    const commission = new Commission(commissionData);
    await commission.save();
    
    // Update agent's commission totals
    await User.findByIdAndUpdate(agentId, {
      $inc: { 
        'agent.totalCommissionEarned': commission.commissionAmount,
        'agent.pendingCommission': commission.commissionAmount
      }
    });
    
    res.status(201).json({
      message: 'Commission created successfully',
      commission
    });
  } catch (error) {
    console.error('Create commission error:', error);
    res.status(500).json({ error: 'Failed to create commission.' });
  }
};

const updateCommission = async (req, res) => {
  try {
    const { commissionId } = req.params;
    const agentId = req.user._id;
    
    const commission = await Commission.findOneAndUpdate(
      { _id: commissionId, agentId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!commission) {
      return res.status(404).json({ error: 'Commission not found.' });
    }
    
    res.json({
      message: 'Commission updated successfully',
      commission
    });
  } catch (error) {
    console.error('Update commission error:', error);
    res.status(500).json({ error: 'Failed to update commission.' });
  }
};

// Market Analysis
const getMarketAnalyses = async (req, res) => {
  try {
    const agentId = req.user._id;
    const { location, page = 1, limit = 10 } = req.query;
    
    const query = { agentId };
    if (location) {
      query['location.city'] = location.city;
      query['location.state'] = location.state;
    }
    
    const analyses = await MarketAnalysis.find(query)
      .sort({ 'analysisPeriod.endDate': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await MarketAnalysis.countDocuments(query);
    
    res.json({
      analyses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get market analyses error:', error);
    res.status(500).json({ error: 'Failed to fetch market analyses.' });
  }
};

const createMarketAnalysis = async (req, res) => {
  try {
    const agentId = req.user._id;
    const analysisData = { ...req.body, agentId };
    
    const analysis = new MarketAnalysis(analysisData);
    await analysis.save();
    
    res.status(201).json({
      message: 'Market analysis created successfully',
      analysis
    });
  } catch (error) {
    console.error('Create market analysis error:', error);
    res.status(500).json({ error: 'Failed to create market analysis.' });
  }
};

// Professional Profile
const getAgentProfile = async (req, res) => {
  try {
    const { agentId } = req.params;
    
    const agent = await User.findById(agentId)
      .select('-password')
      .populate('agent.agency');
    
    if (!agent || agent.userType !== 'agent') {
      return res.status(404).json({ error: 'Agent not found.' });
    }
    
    // Get agent's reviews
    const reviews = await Review.find({ agentId })
      .populate('reviewerId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    // Get agent's recent listings
    const recentListings = await Property.find({ agentId })
      .select('title price address images status')
      .sort({ createdAt: -1 })
      .limit(6);
    
    // Get agent's statistics
    const stats = await Promise.all([
      Client.countDocuments({ agentId }),
      Property.countDocuments({ agentId }),
      Commission.aggregate([
        { $match: { agentId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ])
    ]);
    
    res.json({
      agent,
      reviews,
      recentListings,
      stats: {
        totalClients: stats[0],
        totalProperties: stats[1],
        totalCommissions: stats[2][0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get agent profile error:', error);
    res.status(500).json({ error: 'Failed to fetch agent profile.' });
  }
};

// Update Agent Profile
const updateAgentProfile = async (req, res) => {
  try {
    const agentId = req.user._id;
    const updates = req.body;
    
    // Only allow updating agent-specific fields
    const allowedFields = [
      'agent.licenseNumber',
      'agent.agency',
      'agent.experience',
      'agent.specializations',
      'agent.languages',
      'agent.servicesOffered',
      'agent.availability',
      'agent.socialMediaHandles',
      'agent.metrics',
      'bio',
      'location',
      'company'
    ];
    
    const sanitizedUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) || key.startsWith('agent.')) {
        sanitizedUpdates[key] = updates[key];
      }
    });
    
    const agent = await User.findByIdAndUpdate(
      agentId,
      { $set: sanitizedUpdates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }
    
    res.json({
      message: 'Profile updated successfully',
      agent
    });
  } catch (error) {
    console.error('Update agent profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

module.exports = {
  getAgentDashboard,
  getClients,
  getClient,
  createClient,
  updateClient,
  addClientInteraction,
  getLeads,
  getLead,
  createLead,
  updateLead,
  addLeadInteraction,
  convertLeadToClient,
  getCommissions,
  createCommission,
  updateCommission,
  getMarketAnalyses,
  createMarketAnalysis,
  getAgentProfile,
  updateAgentProfile
};
