// server/routes/watermark.routes.js
const router = require('express').Router();
const multer = require('multer');
const watermarkController = require('../controllers/watermark.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Configure multer for memory storage
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Error handling middleware for multer
const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      // An unknown error occurred when uploading
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    }
    // Everything went fine
    next();
  });
};

router.post('/upload', 
  authMiddleware, 
  uploadMiddleware,
  watermarkController.uploadImage
);

router.post('/verify',
  uploadMiddleware,
  watermarkController.verifyImage
);

module.exports = router;