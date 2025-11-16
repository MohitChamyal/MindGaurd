const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'sender.model'
    },
    model: {
      type: String,
      required: true,
      enum: ['User', 'Doctor', 'Admin']
    },
    name: {
      type: String,
      required: true
    }
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
      refPath: 'readBy.model'
    },
    model: {
      type: String,
      enum: ['User', 'Doctor', 'Admin']
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

// Create indexes for better query performance
chatMessageSchema.index({ conversationId: 1, createdAt: 1 });
chatMessageSchema.index({ 'sender.id': 1 });
chatMessageSchema.index({ 'readBy.user': 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage; 