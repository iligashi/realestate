const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Parse FRONTEND_URL environment variable to get allowed origins
const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    return [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ]; // Default fallback with both ports and IP variants
  }
  
  // Split by comma and trim whitespace
  return frontendUrl.split(',').map(url => url.trim());
};

const allowedOrigins = getAllowedOrigins();
console.log('Allowed CORS origins:', allowedOrigins);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('combined'));

// CORS configuration with multiple origin support
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Log all origins for debugging
    console.log('Request origin:', origin);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      // During development, be more permissive
      if (process.env.NODE_ENV === 'development') {
        console.log('Allowing blocked origin in development mode');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // Cache preflight for 1 day
}));

// Trust proxy for rate limiting (fixes X-Forwarded-For header error)
app.set('trust proxy', 1);

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for profile pictures
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import database connection
const connectDB = require('./config/database');

// Connect to database
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api', require('./routes/public'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Handle favicon and manifest requests to prevent 500 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content
});

app.get('/manifest.json', (req, res) => {
  res.status(204).end(); // No content
});

// Test endpoint for debugging
app.post('/test-upload', (req, res) => {
  console.log('=== Test upload endpoint ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  res.json({ 
    message: 'Test endpoint working',
    body: req.body,
    files: req.files ? req.files.length : 0
  });
});

// Test property creation without files
app.post('/test-property', async (req, res) => {
  try {
    console.log('=== Test property creation ===');
    console.log('Request body:', req.body);
    
    // Test with minimal data
    const testProperty = {
      title: 'Test Property',
      description: 'Test Description',
      propertyType: 'apartment',
      listingType: 'sale',
      price: 100000,
      currency: 'USD',
      status: 'pending',
      owner: '507f1f77bcf86cd799439011', // Test ObjectId
      address: {
        city: 'Test City',
        country: 'US'
      },
      location: {
        type: 'Point',
        coordinates: [0, 0]
      },
      details: {
        bedrooms: 2,
        bathrooms: 1,
        squareMeters: 100,
        yearBuilt: 2025
      },
      features: {
        parkingAvailable: false,
        furnished: false,
        petFriendly: false,
        featured: false
      },
      amenities: [],
      photos: []
    };
    
    console.log('Test property data:', testProperty);
    
    // Try to create the Property model
    const Property = require('./models/Property');
    const property = new Property(testProperty);
    console.log('Property model created');
    
    // Try to save
    const saved = await property.save();
    console.log('Property saved successfully:', saved._id);
    
    res.json({ 
      message: 'Test property created successfully',
      propertyId: saved._id
    });
    
  } catch (error) {
    console.error('Test property creation error:', error);
    res.status(500).json({ 
      error: 'Test property creation failed',
      details: error.message,
      stack: error.stack
    });
  }
});

// Import error handling middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// 404 handler for undefined routes
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
