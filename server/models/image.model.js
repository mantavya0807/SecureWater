const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  metadata: {
    timestamp: {
      type: Date,
      default: Date.now
    },
    fileSize: Number,
    mimeType: String,
    dimensions: {
      width: Number,
      height: Number
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Image', imageSchema);