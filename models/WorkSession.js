const mongoose = require('mongoose');

const workSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  totalHours: {
    type: Number, // Hours worked in decimal format (e.g., 8.5 for 8 hours 30 minutes)
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
workSessionSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('WorkSession', workSessionSchema);


