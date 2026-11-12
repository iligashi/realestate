const http = require('http');

// Start error tracking before anything else runs
require('./utils/sentry').initSentry();

const config = require('./config/env');
const app = require('./app');
const connectDB = require('./config/database');
const SocketServer = require('./websocket/socketServer');
const logger = require('./utils/logger');
const bootstrapAdmin = require('./utils/bootstrapAdmin');

const server = http.createServer(app);

// Real-time messaging and notifications
const socketServer = new SocketServer(server);
// Controllers emit events through this instance
global.socketServer = socketServer;

const start = async () => {
  await connectDB();
  await bootstrapAdmin().catch((err) => logger.error('Admin bootstrap failed:', err));
  // Listings saved as "rent" were invisible on the rentals page, which looks for "rental"
  await require('./models/Property')
    .updateMany({ listingType: 'rent' }, { $set: { listingType: 'rental' } })
    .then((r) => r.modifiedCount && logger.info(`Renamed listing type rent -> rental on ${r.modifiedCount} listing(s)`))
    .catch((err) => logger.error('Listing type cleanup failed:', err));
  server.listen(config.port, () => {
    logger.info(`API listening on http://localhost:${config.port} (${config.nodeEnv})`);
    logger.info(`Allowed CORS origins: ${config.allowedOrigins.join(', ')}`);
  });
};

start();

module.exports = { app, server, socketServer };
