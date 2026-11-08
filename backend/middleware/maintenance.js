const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { tokenFromRequest } = require('../utils/authCookie');
const { getSettings, isMaintenanceActive } = require('../utils/settings');
const logger = require('../utils/logger');

const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// This runs before the per-route auth middleware, so look the caller up here.
async function isAdminRequest(req) {
  try {
    const token = tokenFromRequest(req);
    if (!token) return false;
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(userId).select('userType isActive');
    return Boolean(user?.isActive && user.userType === 'admin');
  } catch {
    return false;
  }
}

// While maintenance mode is on, the site stays readable but only admins can
// change data. Auth routes stay open so admins can still sign in.
const maintenanceGuard = async (req, res, next) => {
  if (READ_METHODS.includes(req.method) || req.path.startsWith('/auth')) return next();
  try {
    const settings = await getSettings();
    if (!isMaintenanceActive(settings)) return next();
    if (await isAdminRequest(req)) return next();
    return res.status(503).json({
      error: settings.maintenance?.maintenanceMessage || 'The platform is under maintenance. Please try again later.',
      maintenance: true,
    });
  } catch (error) {
    logger.error('Maintenance check failed:', error);
    return next();
  }
};

module.exports = { maintenanceGuard };
