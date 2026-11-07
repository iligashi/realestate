// Image uploads with pluggable storage.
//
// - Cloudinary when CLOUDINARY_URL is set (recommended in production: files
//   survive redeploys and are served from a CDN)
// - Local disk under backend/uploads otherwise (development)
//
// Either way, every accepted file ends up with `file.url`, which is what
// controllers save in the database.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const logger = require('./logger');

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const useCloudinary = () => Boolean(process.env.CLOUDINARY_URL);

let cloudinary;
const getCloudinary = () => {
  if (!cloudinary) {
    // Reads credentials from CLOUDINARY_URL automatically
    cloudinary = require('cloudinary').v2;
    cloudinary.config({ secure: true });
  }
  return cloudinary;
};

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const fileFilter = (req, file, cb) => {
  // SVG and other types are rejected: SVGs can carry scripts
  if (ALLOWED[file.mimetype]) return cb(null, true);
  const err = new Error('Only JPEG, PNG, WebP or GIF images are allowed.');
  err.statusCode = 400;
  return cb(err);
};

const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(
      { folder: `realestate/${folder}`, resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(file.buffer);
  });

const saveToDisk = async (file, folder) => {
  const dir = path.join(UPLOAD_ROOT, folder);
  await fs.promises.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ALLOWED[file.mimetype]}`;
  await fs.promises.writeFile(path.join(dir, name), file.buffer);
  return `/uploads/${folder}/${name}`;
};

/**
 * Express middleware that accepts images from multipart form data.
 * @param {object} options
 * @param {string} options.folder    sub-folder, e.g. 'property-images'
 * @param {string} options.field     form field name
 * @param {number} [options.maxFiles] >1 accepts an array of files
 * @param {number} [options.maxSizeMB]
 */
const imageUpload = ({ folder, field, maxFiles = 1, maxSizeMB = 10 }) => {
  const parser = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024, files: maxFiles }
  });
  const parse = maxFiles > 1 ? parser.array(field, maxFiles) : parser.single(field);

  return (req, res, next) => {
    parse(req, res, async (err) => {
      if (err) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? `Each image must be smaller than ${maxSizeMB} MB.`
            : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
              ? `You can upload up to ${maxFiles} image${maxFiles > 1 ? 's' : ''}.`
              : err.message;
        return res.status(400).json({ error: message });
      }

      const files = req.files || (req.file ? [req.file] : []);
      try {
        for (const file of files) {
          if (useCloudinary()) {
            const result = await uploadToCloudinary(file, folder);
            file.url = result.secure_url;
            file.publicId = result.public_id;
          } else {
            file.url = await saveToDisk(file, folder);
          }
          delete file.buffer; // free memory early
        }
        return next();
      } catch (uploadError) {
        logger.error('Image upload failed:', uploadError);
        return res.status(502).json({ error: 'Could not store the image. Please try again.' });
      }
    });
  };
};

module.exports = { imageUpload, useCloudinary, ALLOWED_IMAGE_TYPES: Object.keys(ALLOWED) };
