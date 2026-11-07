const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connectDB = async (uri = config.mongoUri) => {
  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => logger.error('MongoDB connection error:', err));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

    return conn;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    logger.error('Check MONGODB_URI in backend/.env, or start MongoDB with `docker compose up -d mongo`.');
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  await mongoose.connection.close();
  logger.info(`MongoDB connection closed (${signal})`);
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

module.exports = connectDB;
