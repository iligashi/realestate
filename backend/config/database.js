const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async (uri = config.mongoUri) => {
  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));

    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Check MONGODB_URI in backend/.env, or start MongoDB with `docker compose up -d mongo`.');
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  await mongoose.connection.close();
  console.log(`MongoDB connection closed (${signal})`);
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

module.exports = connectDB;
