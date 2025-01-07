// server/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found, authorization denied.' });
    }

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

module.exports = auth;
