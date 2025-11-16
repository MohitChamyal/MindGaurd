const express = require('express');
const router = express.Router();
const { Conversation } = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Middleware to verify user exists
const verifyUser = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.body.userId;
    if (!userId) {
      return res.status(400).json({ success: false, msg: 'User ID is required' });
    }
    
    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, msg: 'Invalid user ID format' });
    }
    
    // Check if user exists in any of the models
    const user = await User.findById(userId).select('-password');
    const doctor = await Doctor.findById(userId).select('-password');
    const admin = await Admin.findById(userId).select('-password');
    
    if (!user && !doctor && !admin) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }
    
    // Store the actual user object as well for easier access
    req.userData = user || doctor || admin;
    req.userType = user ? 'User' : (doctor ? 'Doctor' : 'Admin');
    req.userRole = user ? 'patient' : (doctor ? 'doctor' : 'admin');
    
    // Ensure we have consistent user identification fields
    req.userName = req.userData.fullName || req.userData.username || 'Unknown User';
    next();
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ success: false, msg: 'Server error', error: error.message });
  }
};

// Get all conversations for a user
router.get('/conversations/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    console.log(`Fetching conversations for user: ${userId}, userType: ${req.userType}`);
    
    // First find the conversations without populating to avoid model errors
    const conversations = await Conversation.find({
      'participants.user': userId,
      isActive: true
    })
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
    
    // Now process each conversation manually
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      // Get other participants (not the current user)
      const otherParticipantsData = conv.participants.filter(
        p => p.user.toString() !== userId
      );
      
      // Manually get other participant details
      const otherParticipants = [];
      for (const p of otherParticipantsData) {
        try {
          let participantData = null;
          
          // Try to find participant in each model with improved admin handling
          if (p.role === 'patient') {
            participantData = await User.findById(p.user).select('username email profileImage');
          } else if (p.role === 'doctor') {
            participantData = await Doctor.findById(p.user).select('fullName email specialization profileImage');
          } else if (p.role === 'admin') {
            // More comprehensive admin data selection to ensure admin participants are correctly identified
            participantData = await Admin.findById(p.user).select('fullName username email role profileImage');
            // Ensure the role is explicitly set for admins
            if (participantData) {
              participantData.role = 'admin';
            }
          }
          
          if (participantData) {
            otherParticipants.push({
              id: p.user,
              name: participantData.fullName || participantData.username || 'Unknown',
              username: participantData.username || null,
              role: p.role,
              profileImage: participantData.profileImage || null,
              specialty: participantData.specialization || null,
              email: participantData.email
            });
          }
        } catch (err) {
          console.error(`Error fetching participant data: ${err.message}`);
        }
      }
      
      // Count unread messages
      const unreadCount = await ChatMessage.countDocuments({
        conversationId: conv._id,
        'readBy.user': { $ne: userId },
        'sender.id': { $ne: userId }
      });
      
      return {
        id: conv._id,
        participants: otherParticipants,
        lastMessage: conv.lastMessage ? {
          content: conv.lastMessage.content,
          timestamp: conv.lastMessage.timestamp,
          senderId: conv.lastMessage.sender
        } : null,
        unreadCount,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
        title: conv.title || otherParticipants.map(p => p.name).join(', ')
      };
    }));
    
    const total = await Conversation.countDocuments({
      'participants.user': userId,
      isActive: true
    });
    
    console.log(`Returning ${formattedConversations.length} conversations`);
    
    res.json({
      success: true,
      conversations: formattedConversations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ success: false, msg: 'Server error', error: error.message });
  }
});

// Get messages from a conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;
    const { page = 1, limit = 20 } = req.query;
    
    if (!conversationId || !userId) {
      return res.status(400).json({ success: false, msg: 'Conversation ID and User ID are required' });
    }
    
    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId,
      isActive: true
    });
    
    if (!conversation) {
      return res.status(404).json({ success: false, msg: 'Conversation not found or user not authorized' });
    }
    
    // Get messages
    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await ChatMessage.countDocuments({ conversationId });
    
    // Mark messages as read
    await ChatMessage.updateMany(
      {
        conversationId,
        'sender.id': { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $addToSet: {
          readBy: {
            user: userId,
            model: 'User', // This could be wrong if the user is not a Patient
            readAt: new Date()
          }
        }
      }
    );
    
    res.json({
      success: true,
      messages,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ success: false, msg: 'Server error', error: error.message });
  }
});

// Create a new conversation
router.post('/conversations', verifyUser, async (req, res) => {
  try {
    const { userId, participants, title } = req.body;
    
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ success: false, msg: 'Participants array is required' });
    }
    
    // Make sure the current user is included
    const allParticipants = [
      { user: userId, role: req.userRole },
      ...participants.map(p => ({
        user: p.userId,
        role: p.role
      }))
    ];
    
    // Validate all participants exist
    for (const participant of participants) {
      if (!mongoose.Types.ObjectId.isValid(participant.userId)) {
        return res.status(400).json({ success: false, msg: `Invalid participant ID: ${participant.userId}` });
      }
      
      let participantExists = false;
      
      if (participant.role === 'patient') {
        participantExists = await User.exists({ _id: participant.userId });
      } else if (participant.role === 'doctor') {
        participantExists = await Doctor.exists({ _id: participant.userId });
      } else if (participant.role === 'admin') {
        participantExists = await Admin.exists({ _id: participant.userId });
      }
      
      if (!participantExists) {
        return res.status(404).json({ success: false, msg: `Participant not found: ${participant.userId}` });
      }
    }

    // Check if conversation already exists between these participants
    const existingConversation = await Conversation.findOne({
      $and: [
        { isActive: true },
        { participants: { $size: allParticipants.length } },
        ...allParticipants.map(p => ({
          'participants.user': p.user
        }))
      ]
    });

    if (existingConversation) {
      // Return the existing conversation
      return res.json({
        success: true,
        msg: 'Using existing conversation',
        conversation: existingConversation
      });
    }
    
    // Create a new conversation
    const newConversation = new Conversation({
      participants: allParticipants,
      participantModel: req.userType,
      title: title || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    });
    
    await newConversation.save();
    
    res.status(201).json({
      success: true,
      msg: 'Conversation created',
      conversation: newConversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, msg: 'Server error', error: error.message });
  }
});

// Send a message to a conversation
router.post('/conversations/:conversationId/messages', verifyUser, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, content, attachments } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, msg: 'Message content is required' });
    }
    
    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId,
      isActive: true
    });
    
    if (!conversation) {
      return res.status(404).json({ success: false, msg: 'Conversation not found or user not authorized' });
    }
    
    // Create a new message with consistent sender information
    const newMessage = new ChatMessage({
      conversationId,
      sender: {
        id: userId,
        model: req.userType,
        name: req.userName,
        role: req.userRole
      },
      content,
      attachments: attachments || [],
      readBy: [{
        user: userId,
        model: req.userType,
        readAt: new Date()
      }],
      createdAt: new Date()
    });
    
    await newMessage.save();
    
    // Update the conversation's last message
    await Conversation.updateOne(
      { _id: conversationId },
      {
        lastMessage: {
          content,
          sender: userId,
          senderName: req.userName,
          senderRole: req.userRole,
          timestamp: new Date()
        },
        updatedAt: new Date()
      }
    );
    
    res.status(201).json({
      success: true,
      msg: 'Message sent',
      message: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, msg: 'Server error', error: error.message });
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/read', verifyUser, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    
    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId,
      isActive: true
    });
    
    if (!conversation) {
      return res.status(404).json({ success: false, msg: 'Conversation not found or user not authorized' });
    }
    
    // Mark messages as read
    const result = await ChatMessage.updateMany(
      {
        conversationId,
        'sender.id': { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $addToSet: {
          readBy: {
            user: userId,
            model: req.userType,
            readAt: new Date()
          }
        }
      }
    );
    
    res.json({
      success: true,
      msg: 'Messages marked as read',
      updated: result.nModified
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, msg: 'Server error', error: error.message });
  }
});

// Delete/Archive a conversation
router.delete('/conversations/:conversationId', verifyUser, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    
    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId,
      isActive: true
    });
    
    if (!conversation) {
      return res.status(404).json({ success: false, msg: 'Conversation not found or user not authorized' });
    }
    
    // Archive the conversation (soft delete)
    await Conversation.updateOne(
      { _id: conversationId },
      { isActive: false }
    );
    
    res.json({
      success: true,
      msg: 'Conversation archived'
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ success: false, msg: 'Server error', error: error.message });
  }
});

module.exports = router;