const mongoose = require('mongoose');
const Property = require('../models/Property');
const User = require('../models/User');
const Message = require('../models/Message');
const logger = require('../utils/logger');

const PUBLIC_STATUSES = ['active', 'under-contract', 'sold', 'rented'];
// Statuses an agent can move an approved listing between
const AGENT_STATUSES = ['active', 'inactive', 'under-contract', 'sold', 'rented'];

const LISTING_FIELDS = 'title address price currency listingType propertyType status photos analytics owner agent createdAt updatedAt';
const PUBLIC_AGENT_FIELDS = 'firstName lastName avatar profilePicture bio phone email location agent company createdAt';

// Listings an agent works on: assigned to them or created by them.
const agentScope = (userId) => ({ $or: [{ agent: userId }, { owner: userId }] });

// GET /api/agent/dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const scope = agentScope(userId);

    const [listings, unread, openThreads] = await Promise.all([
      Property.find(scope)
        .select(LISTING_FIELDS)
        .populate('owner', 'firstName lastName email phone')
        .sort({ updatedAt: -1 })
        .lean(),
      Message.countDocuments({ seller: userId, status: { $ne: 'closed' }, thread: { $elemMatch: { isRead: false, sender: { $ne: userId } } } }),
      Message.countDocuments({ seller: userId, status: { $ne: 'closed' } }),
    ]);

    const byStatus = listings.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    const totals = listings.reduce(
      (acc, p) => {
        acc.views += p.analytics?.views || 0;
        acc.inquiries += p.analytics?.inquiries || 0;
        acc.saves += p.analytics?.saves || 0;
        return acc;
      },
      { views: 0, inquiries: 0, saves: 0 }
    );
    const closed = (byStatus.sold || 0) + (byStatus.rented || 0);
    const closedValue = listings
      .filter((p) => p.status === 'sold' || p.status === 'rented')
      .reduce((sum, p) => sum + (p.price || 0), 0);

    res.json({
      stats: {
        totalListings: listings.length,
        assigned: listings.filter((p) => String(p.agent) === String(userId) && String(p.owner?._id) !== String(userId)).length,
        active: byStatus.active || 0,
        pending: byStatus.pending || 0,
        underContract: byStatus['under-contract'] || 0,
        closed,
        closedValue,
        openConversations: openThreads,
        unreadConversations: unread,
        ...totals,
      },
      byStatus,
      recentListings: listings.slice(0, 6),
    });
  } catch (error) {
    logger.error('Agent dashboard error:', error);
    res.status(500).json({ error: 'Failed to load agent dashboard.' });
  }
};

// GET /api/agent/listings?status=&assigned=true
const getListings = async (req, res) => {
  try {
    const filter = agentScope(req.user._id);
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.assigned === 'true') {
      delete filter.$or;
      filter.agent = req.user._id;
    }
    const listings = await Property.find(filter)
      .select(LISTING_FIELDS)
      .populate('owner', 'firstName lastName email phone')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ listings });
  } catch (error) {
    logger.error('Agent listings error:', error);
    res.status(500).json({ error: 'Failed to load listings.' });
  }
};

// PATCH /api/agent/listings/:id/status { status }
const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid listing id.' });
    if (!AGENT_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${AGENT_STATUSES.join(', ')}.` });
    }
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ error: 'Listing not found.' });

    const isAdmin = req.user.userType === 'admin';
    const mine = String(property.agent) === String(req.user._id) || String(property.owner) === String(req.user._id);
    if (!isAdmin && !mine) return res.status(403).json({ error: 'This listing is not assigned to you.' });
    if (!isAdmin && property.status === 'pending') {
      return res.status(403).json({ error: 'This listing is waiting for admin approval.' });
    }

    property.status = status;
    await property.save();
    res.json({ message: 'Status updated', property });
  } catch (error) {
    logger.error('Agent status update error:', error);
    res.status(500).json({ error: 'Failed to update status.' });
  }
};

// GET /api/agents  (public directory)
const listAgents = async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const filter = { userType: 'agent', isActive: true, isBlocked: { $ne: true } };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ firstName: rx }, { lastName: rx }, { 'agent.agency': rx }, { company: rx }, { 'location.city': rx }];
    }
    const agents = await User.find(filter).select(PUBLIC_AGENT_FIELDS).sort({ 'agent.rating.average': -1, createdAt: 1 }).limit(100).lean();

    const counts = await Property.aggregate([
      { $match: { agent: { $in: agents.map((a) => a._id) }, status: { $in: PUBLIC_STATUSES } } },
      { $group: { _id: '$agent', active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }, closed: { $sum: { $cond: [{ $in: ['$status', ['sold', 'rented']] }, 1, 0] } } } },
    ]);
    const byAgent = Object.fromEntries(counts.map((c) => [String(c._id), c]));

    // Busiest agents first
    const withCounts = agents
      .map((a) => ({
        ...a,
        activeListings: byAgent[String(a._id)]?.active || 0,
        closedDeals: byAgent[String(a._id)]?.closed || 0,
      }))
      .sort((a, b) => b.activeListings + b.closedDeals - (a.activeListings + a.closedDeals));

    res.json({ agents: withCounts });
  } catch (error) {
    logger.error('List agents error:', error);
    res.status(500).json({ error: 'Failed to load agents.' });
  }
};

// GET /api/agents/:id  (public profile)
const getAgentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ error: 'Agent not found.' });
    const agent = await User.findOne({ _id: id, userType: 'agent', isActive: true, isBlocked: { $ne: true } })
      .select(PUBLIC_AGENT_FIELDS)
      .lean();
    if (!agent) return res.status(404).json({ error: 'Agent not found.' });

    const listings = await Property.find({ agent: id, status: { $in: PUBLIC_STATUSES } })
      .select('title address price currency listingType propertyType status photos details createdAt')
      .sort({ status: 1, createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ agent, listings });
  } catch (error) {
    logger.error('Agent profile error:', error);
    res.status(500).json({ error: 'Failed to load agent.' });
  }
};

module.exports = { getDashboard, getListings, updateListingStatus, listAgents, getAgentProfile, AGENT_STATUSES };
