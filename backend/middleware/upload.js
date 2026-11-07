const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/profiles/';
if (!fs.existsSync(uploadDir)) {
  logger.debug('Creating uploads directory:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
} else {
  logger.debug('Uploads directory already exists:', uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    logger.debug('Multer destination called with file:', file.originalname);
    logger.debug('Saving to directory:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    logger.debug('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter - explicitly support common image formats
const fileFilter = (req, file, cb) => {
  logger.debug('File filter called with file:', file.originalname, 'MIME:', file.mimetype);
  
  // Check file extension
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  // Check MIME type
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    logger.debug('File accepted:', file.originalname);
    cb(null, true);
  } else {
    logger.debug('File rejected:', file.originalname, 'MIME:', file.mimetype, 'Extension:', fileExtension);
    cb(new Error(`Only image files are allowed! Supported formats: ${allowedExtensions.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

module.exports = upload;
