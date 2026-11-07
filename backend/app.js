const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sanitize } = require('./middleware/sanitize');
const { requireCsrfHeader } = require('./utils/authCookie');

const app = express();

app.set('trust proxy', config.trustProxy);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
if (!config.isTest) {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin and non-browser clients (curl, mobile apps)
      if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
      // Be permissive while developing locally
      if (config.isDevelopment) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400
  })
);

app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.isProduction ? 300 : 1000,
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Strip MongoDB operators from user input and cap page sizes
app.use(sanitize);

// Cookie-authenticated writes must come from our own frontend
app.use('/api', requireCsrfHeader);

// Uploaded images (profile pictures, property photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/rental-applications', require('./routes/rentalApplications'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api', require('./routes/public'));

app.use(notFound);

// Report unexpected errors (no-op unless SENTRY_DSN is set)
const Sentry = require('./utils/sentry').getSentry();
if (Sentry) Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

module.exports = app;
