// backend/models/Image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model to reference
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false, // Optional description
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
