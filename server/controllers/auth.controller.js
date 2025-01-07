// server/controllers/auth.controller.js

const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Helper function to generate a unique pixelPattern.
 * Generates an array of 100 random bits (0s and 1s).
 */
function generatePixelPattern(length = 100) {
  const pattern = [];
  for (let i = 0; i < length; i++) {
    pattern.push(Math.round(Math.random()));
  }
  return pattern;
}

// POST /auth/register
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all required fields.' });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with that email or username already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate pixelPattern
    const pixelPattern = generatePixelPattern(100); // 100 bits

    // Create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      pixelPattern
    });

    const savedUser = await newUser.save();

    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, { expiresIn: '1d' });

    // Respond with token and user data (excluding password)
    res.json({
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        pixelPattern: savedUser.pixelPattern
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all required fields.' });
  }

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    // Respond with token and user data (excluding password)
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        pixelPattern: user.pixelPattern
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};
