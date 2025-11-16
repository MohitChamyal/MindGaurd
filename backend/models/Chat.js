const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'conversation.participantModel'
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    fileType: String,
    fileSize: Number,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'conversation.participantModel'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'participantModel'
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true
    }
  }],
  participantModel: {
    type: String,
    required: true,
    enum: ['User', 'Doctor', 'Admin']
  },
  title: {
    type: String,
    default: ''
  },
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'participantModel'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Create indexes for better performance
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ updatedAt: -1 });

// Define the Chat model
const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Conversation, Message }; 