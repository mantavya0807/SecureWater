// server/routes/watermark.routes.js

const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const watermarkController = require('../controllers/watermark.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Configure multer for disk storage for /upload
const storageDisk = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)){
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadDisk = multer({ storage: storageDisk });

// Configure multer for memory storage
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only JPG and PNG files are allowed.'), false);
    }
    cb(null, true);
  }
});

// Error handling middleware for disk upload
const uploadDiskMiddleware = (req, res, next) => {
  uploadDisk.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ message: 'File upload error.', error: err.message });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({ message: 'File upload error.', error: err.message });
    }
    // Everything went fine.
    next();
  });
};

// Simplified middleware
const uploadMiddleware = (req, res, next) => {
  uploadMemory.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        message: 'File upload error', 
        error: err.message 
      });
    }
    next();
  });
};

// POST /watermark/upload
router.post('/upload',
  authMiddleware,
  uploadDiskMiddleware,
  watermarkController.uploadImage
);

// POST /watermark/verify
router.post('/verify',
  authMiddleware,
  uploadMiddleware,
  watermarkController.verifyImage
);

module.exports = router;
