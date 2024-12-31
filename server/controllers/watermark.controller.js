const Image = require('../models/image.model');
const User = require('../models/user.model');
const sharp = require('sharp');

// Generate a unique pixel pattern for a user
const generatePixelPattern = (userId, patternSize = 16) => {
  const pattern = [];
  let currentSeed = parseInt(userId.toString('hex').substr(0, 8), 16);
  
  // Pseudo-random number generator using the seed
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  // Generate subtle pixel alterations (values between -2 and 2)
  for (let i = 0; i < patternSize; i++) {
    pattern.push(Math.floor(random() * 5) - 2);
  }
  
  return pattern;
};

// Apply pixel pattern to an image buffer
const applyPixelPattern = async (imageBuffer, pattern) => {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  
  // Get raw pixel data
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Create a new buffer for the modified image data
  const modifiedData = Buffer.from(data);

  // Apply pattern to pixels
  for (let i = 0; i < modifiedData.length; i += info.channels) {
    const patternIndex = (Math.floor(i / info.channels) % pattern.length);
    // Only modify blue channel slightly to minimize visibility
    if (info.channels > 2) { // Ensure image has a blue channel
      modifiedData[i + 2] = Math.max(0, Math.min(255, modifiedData[i + 2] + pattern[patternIndex]));
    }
  }

  // Reconstruct image
  return await sharp(modifiedData, {
    raw: {
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels
    }
  })
  .toFormat(metadata.format || 'jpeg')
  .toBuffer();
};

// Extract and analyze pixel pattern from image
const extractPixelPattern = async (imageBuffer, pattern, tolerance = 2) => {
  const image = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data } = image;
  let matches = 0;
  let totalChecks = Math.floor(data.length / 3);
  
  // Check only blue channel values against pattern
  for (let i = 2; i < data.length; i += 3) {
    const patternIndex = (Math.floor(i / 3) % pattern.length);
    const expectedDiff = pattern[patternIndex];
    const actualValue = data[i];
    
    // Check if the pixel value is within tolerance of expected pattern
    if (Math.abs(actualValue % 5 - (expectedDiff + 2)) <= tolerance) {
      matches++;
    }
  }

  return matches / totalChecks; // Return match percentage
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.user.id);
    
    try {
      // Get image metadata
      const metadata = await sharp(req.file.buffer).metadata();
      
      // Generate or retrieve user's pixel pattern
      let pixelPattern = user.pixelPattern;
      if (!pixelPattern || pixelPattern.length === 0) {
        pixelPattern = generatePixelPattern(user._id);
        await User.findByIdAndUpdate(user._id, { pixelPattern });
      }

      // Apply watermark pattern
      const watermarkedImage = await applyPixelPattern(req.file.buffer, pixelPattern);

      // Save image metadata
      const image = new Image({
        userId: user._id,
        originalName: req.file.originalname,
        metadata: {
          timestamp: Date.now(),
          fileSize: req.file.size,
          mimeType: metadata.format || 'jpeg',
          dimensions: {
            width: metadata.width,
            height: metadata.height
          }
        }
      });

      await image.save();
      
      // Update user's image list
      if (!user.watermarkedImages.includes(image._id)) {
        await User.findByIdAndUpdate(user._id, {
          $push: { watermarkedImages: image._id }
        });
      }

      // Send response
      res.set({
        'Content-Type': `image/${metadata.format || 'jpeg'}`,
        'Content-Disposition': `attachment; filename="secured_${req.file.originalname}"`,
        'Cache-Control': 'no-cache'
      });
      
      res.send(watermarkedImage);

    } catch (processingError) {
      console.error('Processing error:', processingError);
      throw new Error(`Image processing failed: ${processingError.message}`);
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Error processing image',
      error: error.message
    });
  }
};

const verifyImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    try {
      const metadata = await sharp(req.file.buffer).metadata();
      const users = await User.find({}).select('_id username email pixelPattern');
      let foundUser = null;
      let highestConfidence = 0;

      // Check against each user's pattern
      for (const user of users) {
        if (!user.pixelPattern || user.pixelPattern.length === 0) continue;

        const confidence = await extractPixelPattern(req.file.buffer, user.pixelPattern);
        if (confidence > highestConfidence && confidence > 0.6) { // 60% threshold
          highestConfidence = confidence;
          foundUser = user;
        }
      }

      const verificationResult = {
        verified: !!foundUser,
        confidence: Math.round(highestConfidence * 100),
        message: foundUser 
          ? `Image verified with ${Math.round(highestConfidence * 100)}% confidence` 
          : 'No valid watermark detected',
        details: {
          timestamp: new Date(),
          imageInfo: {
            name: req.file.originalname,
            format: metadata.format || 'jpeg',
            dimensions: {
              width: metadata.width,
              height: metadata.height
            }
          }
        }
      };

      if (foundUser) {
        verificationResult.details.originalUser = {
          username: foundUser.username,
          email: foundUser.email
        };
      }

      res.json(verificationResult);

    } catch (error) {
      throw new Error(`Image analysis failed: ${error.message}`);
    }

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      message: 'Error verifying image',
      error: error.message,
      details: 'Please ensure you are uploading a valid image file'
    });
  }
};

module.exports = { uploadImage, verifyImage };