const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // Disable automatic _id generation

const questionResponseSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  response: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const userInteractionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true
  },
  interactionType: {
    type: String,
    enum: ['chat', 'questionnaire', 'report'],
    required: true
  },
  chatHistory: [chatMessageSchema],
  questionnaireResponses: [questionResponseSchema],
  reportData: {
    title: String,
    filename: String,
    filePath: String,
    fileType: String,
    fileSize: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    analysisResults: {
      summary: {
        mood: { value: Number, change: Number },
        anxiety: { value: String, change: Number },
        sleep: { value: Number, change: Number }
      },
      insights: [{
        area: String,
        insight: String,
        recommendation: String
      }],
      riskFactors: [String]
    }
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  metadata: {
    browser: String,
    platform: String,
    userAgent: String
  }
});

// Create indexes for better query performance
userInteractionSchema.index({ userId: 1, sessionId: 1 });
userInteractionSchema.index({ userId: 1, interactionType: 1 });
userInteractionSchema.index({ startTime: -1 });

module.exports = mongoose.model('UserInteraction', userInteractionSchema); 