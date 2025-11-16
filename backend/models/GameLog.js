const mongoose = require('mongoose');

const GameLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['notes', 'puzzle', 'breathing', 'other'],
  },
  duration: {
    type: Number, // duration in seconds
    required: true,
  },
  completionStatus: {
    type: String,
    enum: ['completed', 'abandoned', 'in-progress'],
    default: 'completed'
  },
  score: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
GameLogSchema.index({ userId: 1, gameType: 1, createdAt: -1 });

module.exports = mongoose.models.GameLog || mongoose.model('GameLog', GameLogSchema); 