const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, {
  timestamps: true
});

// Compound index to ensure unique entries per user per date
MemorySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.Memory || mongoose.model('Memory', MemorySchema); 