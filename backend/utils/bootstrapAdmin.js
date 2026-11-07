// Creates the first admin account on startup from ADMIN_EMAIL / ADMIN_PASSWORD.
// Useful on hosts without a shell (e.g. Render's free plan). Does nothing if
// the variables are unset or the account already exists, so it is safe to
// leave configured. Remove the variables after the first deploy if you like.

const User = require('../models/User');
const logger = require('./logger');

const bootstrapAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;

  if (password.length < 12) {
    logger.warn('ADMIN_PASSWORD must be at least 12 characters; admin account not created.');
    return null;
  }

  const existing = await User.findOne({ email });
  if (existing) return null;

  const admin = await User.create({
    email,
    password,
    firstName: process.env.ADMIN_FIRST_NAME || 'Site',
    lastName: process.env.ADMIN_LAST_NAME || 'Admin',
    userType: 'admin',
    isVerified: true
  });
  logger.info(`Created admin account ${email}`);
  return admin;
};

module.exports = bootstrapAdmin;
