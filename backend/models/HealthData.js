const mongoose = require('mongoose');

const HealthDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  healthreports: {
    mood: { type: Number, default: 0 },
    anxiety: { type: Number, default: 0 },
    sleep: { type: Number, default: 0 },
    energy: { type: Number, default: 0 },
    concentration: { type: Number, default: 0 },
    socialInteraction: { type: Number, default: 0 },
    optimism: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('healthData', HealthDataSchema); 