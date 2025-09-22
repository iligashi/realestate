const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create property-images directory if it doesn't exist
const uploadDir = 'uploads/property-images/';
if (!fs.existsSync(uploadDir)) {
  console.log('Creating property-images directory:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
} else {
  console.log('Property-images directory already exists:', uploadDir);
}

// Simple storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Saving file to:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'property-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// Simple file filter
const fileFilter = (req, file, cb) => {
  console.log('Processing file:', file.originalname, 'Type:', file.mimetype);
  
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create separate multer instances for different upload types
const uploadPropertyImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
}).array('images', 10);

// Single image upload
const uploadPropertyImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
}).single('image');

// Debug wrapper
const uploadPropertyImagesWithDebug = (req, res, next) => {
  console.log('=== uploadPropertyImages middleware ===');
  console.log('Content-Type:', req.headers['content-type']);
  
  uploadPropertyImages(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        error: 'File upload failed', 
        details: err.message 
      });
    }
    
    console.log('Files uploaded successfully:', req.files ? req.files.length : 0);
    console.log('=== End uploadPropertyImages middleware ===');
    next();
  });
};

module.exports = {
  uploadPropertyImage,
  uploadPropertyImages,
  uploadPropertyImagesWithDebug,
  propertyImageUpload: uploadPropertyImages
};
