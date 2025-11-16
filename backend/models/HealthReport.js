const mongoose = require('mongoose');

const HealthReportSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  questionnaireData: {
    mood: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    anxiety: {
      type: String,
      required: true
    },
    sleep_quality: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    energy_levels: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    physical_symptoms: {
      type: String,
      default: ''
    },
    concentration: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    self_care: {
      type: String,
      default: ''
    },
    social_interactions: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    intrusive_thoughts: {
      type: String,
      default: ''
    },
    optimism: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    stress_factors: {
      type: String,
      default: ''
    },
    coping_strategies: {
      type: String,
      default: ''
    },
    social_support: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    self_harm: {
      type: String,
      default: ''
    },
    discuss_professional: {
      type: String,
      default: ''
    }
  },
  voiceAssessment: {
    type: Boolean,
    default: false
  },
  raw_responses: {
    type: Array,
    default: []
  },
  emotionReport: {
    summary: {
      emotions_count: {
        type: Map,
        of: Number,
        default: {}
      },
      average_confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      average_valence: {
        type: Number,
        required: true,
        min: -1,
        max: 1
      },
      crisis_count: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },
      risk_factors: [{
        type: String
      }]
    },
    disorder_indicators: [{
      type: String
    }]
  },
  progressData: {
    moodData: [{
      date: {
        type: Date,
        required: true
      },
      mood: {
        type: Number,
        required: true,
        min: 0,
        max: 10
      },
      anxiety: {
        type: Number,
        required: true,
        min: 0,
        max: 10
      },
      stress: {
        type: Number,
        required: true,
        min: 0,
        max: 10
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
      }
    }],
    sleepData: [{
      date: {
        type: Date,
        required: true
      },
      hours: {
        type: Number,
        required: true,
        min: 0,
        max: 24
      },
      quality: {
        type: Number,
        required: true,
        min: 0,
        max: 10
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
      }
    }],
    activityData: [{
      date: {
        type: Date,
        required: true
      },
      exercise: {
        type: Number,
        required: true,
        min: 0,
        max: 10
      },
      meditation: {
        type: Number,
        required: true,
        min: 0,
        max: 10
      },
      social: {
        type: Number,
        required: true,
        min: 0,
        max: 10
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
      }
    }]
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

// Compound index for efficient querying
HealthReportSchema.index({ userId: 1, timestamp: -1 });

// Index for emotion analysis
HealthReportSchema.index({ 'emotionReport.summary.average_valence': 1 });
HealthReportSchema.index({ 'emotionReport.summary.crisis_count': 1 });

module.exports = mongoose.model('HealthReport', HealthReportSchema); 