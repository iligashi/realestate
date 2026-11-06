const http = require('http');

const config = require('./config/env');
const app = require('./app');
const connectDB = require('./config/database');
const SocketServer = require('./websocket/socketServer');

const server = http.createServer(app);

// Real-time messaging and notifications
const socketServer = new SocketServer(server);
// Controllers emit events through this instance
global.socketServer = socketServer;

const start = async () => {
  await connectDB();
  server.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port} (${config.nodeEnv})`);
    console.log(`Allowed CORS origins: ${config.allowedOrigins.join(', ')}`);
  });
};

start();

module.exports = { app, server, socketServer };
