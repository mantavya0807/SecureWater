// server/controllers/watermark.controller.js

const Image = require('../models/image.model');
const User = require('../models/user.model');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp')

/**
 * Helper function to embed pixelPattern into image's blue channel LSBs.
 * @param {Jimp} image - Jimp image object
 * @param {number[]} pixelPattern - Array of 0s and 1s
 */
function embedPixelPattern(image, pixelPattern) {
  const { width, height } = image.bitmap;
  const totalPixels = width * height;

  if (pixelPattern.length > totalPixels) {
    throw new Error('Pixel pattern is too long for this image.');
  }

  for (let i = 0; i < pixelPattern.length; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    const idx = image.getPixelIndex(x, y);
    const blue = image.bitmap.data[idx + 2];
    image.bitmap.data[idx + 2] = (blue & 0xFE) | pixelPattern[i];
  }
}

/**
 * Helper function to extract pixelPattern from image's blue channel LSBs.
 * @param {Jimp} image - Jimp image object
 * @param {number} length - Number of bits to extract
 * @returns {number[]} - Extracted pixel pattern
 */
function extractPixelPattern(image, length) {
  const { width, height } = image.bitmap;
  const totalPixels = width * height;

  if (length > totalPixels) {
    throw new Error('Requested pixel pattern length exceeds number of pixels.');
  }

  const extracted = [];
  for (let i = 0; i < length; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    const idx = image.getPixelIndex(x, y);
    const blue = image.bitmap.data[idx + 2];
    extracted.push(blue & 1);
  }

  return extracted;
}

/**
 * POST /watermark/upload
 * Uploads and watermarks an image.
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded.' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    // Save image to DB
    const newImage = new Image({
      userId: user._id,
      originalName: req.file.originalname,
      metadata: {
        timestamp: new Date(),
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        dimensions: {
          width: 0, // To be updated after reading image
          height: 0
        }
      }
    });

    // Read image to get dimensions
    const image = await Jimp.read(req.file.path);
    newImage.metadata.dimensions.width = image.bitmap.width;
    newImage.metadata.dimensions.height = image.bitmap.height;

    // Embed pixelPattern into image
    if (!user.pixelPattern || user.pixelPattern.length === 0) {
      return res.status(400).json({ message: 'User pixel pattern not found.' });
    }
    embedPixelPattern(image, user.pixelPattern);
    await image.writeAsync(req.file.path); // Overwrite the image with watermark

    const savedImage = await newImage.save();

    // Add to user's watermarkedImages
    user.watermarkedImages.push(savedImage._id);
    await user.save();

    res.json({ message: 'Image uploaded and watermarked successfully.', imageUrl: `/uploads/${path.basename(req.file.path)}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading and watermarking image.', error: err.message });
  }
};

/**
 * POST /watermark/verify
 * Verifies the watermark in an uploaded image.
 */
exports.verifyImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const userId = req.user._id;

    // Read image buffer using Jimp
    let image;
    try {
      image = await Jimp.read(req.file.buffer);
    } catch (jimpError) {
      console.error('Jimp error:', jimpError);
      return res.status(400).json({ message: 'Invalid image format or corrupted file.' });
    }

    // Get user and validate pixel pattern
    const user = await User.findById(userId);
    if (!user || !user.pixelPattern) {
      return res.status(400).json({ message: 'User or pixel pattern not found.' });
    }

    // Extract pixel pattern
    const extractedPattern = extractPixelPattern(image, user.pixelPattern.length);

    // Compare patterns
    const isMatch = extractedPattern.every((bit, idx) => bit === user.pixelPattern[idx]);

    return res.status(200).json({
      verified: isMatch,
      message: isMatch ? 'Image verified successfully.' : 'Watermark not found or does not match.'
    });

  } catch (error) {
    console.error('Error in verifyImage:', error);
    return res.status(500).json({ 
      message: 'Internal server error during verification.',
      error: error.message 
    });
  }
};
