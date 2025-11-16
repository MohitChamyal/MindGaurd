const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');

// Store active connections
const connections = new Map();

// Initialize WebSocket server
function initializeWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', async (ws, req) => {
    console.log('WebSocket connection established');
    
    // Extract token from query parameters
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    const userType = url.searchParams.get('userType'); // 'patient', 'doctor', 'admin'
    
    if (!token) {
      ws.send(JSON.stringify({ type: 'error', message: 'Authentication token is missing' }));
      ws.close();
      return;
    }
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      
      // Validate user exists
      let user;
      if (userType === 'patient') {
        user = await User.findById(userId).select('username name email');
      } else if (userType === 'doctor') {
        user = await Doctor.findById(userId).select('username name email specialty');
      } else if (userType === 'admin') {
        user = await Admin.findById(userId).select('username name email');
      }
      
      if (!user) {
        ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
        ws.close();
        return;
      }
      
      // Store the connection with user info
      connections.set(userId, {
        ws,
        userId,
        userType,
        name: user.name || user.username
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to chat server',
        userId,
        userType
      }));
      
      // Handle incoming messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle different message types
          switch (data.type) {
            case 'chat':
              handleChatMessage(userId, userType, data);
              break;
              
            case 'typing':
              handleTypingIndicator(userId, userType, data);
              break;
              
            case 'read':
              handleReadReceipt(userId, userType, data);
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        console.log(`WebSocket connection closed for user ${userId}`);
        connections.delete(userId);
        
        // Notify relevant users about disconnection
        // This could be enhanced to only notify users in active conversations
      });
      
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication failed'
      }));
      ws.close();
    }
  });
  
  return wss;
}

// Handle chat messages
async function handleChatMessage(senderId, senderType, data) {
  const { conversationId, recipients, content, messageId } = data;
  
  if (!conversationId || !recipients || !content || !messageId) {
    sendErrorToUser(senderId, 'Missing required fields for chat message');
    return;
  }
  
  // Get sender connection
  const senderConnection = connections.get(senderId);
  if (!senderConnection) {
    return;
  }
  
  // Prepare message to send
  const messageData = {
    type: 'chat',
    conversationId,
    messageId,
    senderId,
    senderType,
    senderName: senderConnection.name,
    content,
    timestamp: new Date().toISOString()
  };
  
  // Track delivery status
  let delivered = false;
  
  // Send to all online recipients
  recipients.forEach((recipientId) => {
    const recipientConnection = connections.get(recipientId);
    if (recipientConnection) {
      recipientConnection.ws.send(JSON.stringify(messageData));
      delivered = true;
      console.log(`Message delivered to online user: ${recipientId}`);
    } else {
      // Log that the recipient is offline
      console.log(`Recipient ${recipientId} is offline. Message will be retrieved when they connect.`);
    }
  });
  
  // Acknowledge message receipt to sender
  senderConnection.ws.send(JSON.stringify({
    type: 'ack',
    messageId,
    conversationId,
    status: 'delivered',
    deliveredToOnline: delivered,
    timestamp: new Date().toISOString()
  }));
}

// Handle typing indicators
function handleTypingIndicator(senderId, senderType, data) {
  const { conversationId, recipients, isTyping } = data;
  
  if (!conversationId || !recipients) {
    sendErrorToUser(senderId, 'Missing required fields for typing indicator');
    return;
  }
  
  // Get sender connection
  const senderConnection = connections.get(senderId);
  if (!senderConnection) {
    return;
  }
  
  // Prepare typing indicator data
  const typingData = {
    type: 'typing',
    conversationId,
    senderId,
    senderName: senderConnection.name,
    isTyping,
    timestamp: new Date().toISOString()
  };
  
  // Send to all online recipients
  recipients.forEach((recipientId) => {
    const recipientConnection = connections.get(recipientId);
    if (recipientConnection) {
      recipientConnection.ws.send(JSON.stringify(typingData));
    }
  });
}

// Handle read receipts
function handleReadReceipt(userId, userType, data) {
  const { conversationId, messageId, senderId } = data;
  
  if (!conversationId || !messageId || !senderId) {
    sendErrorToUser(userId, 'Missing required fields for read receipt');
    return;
  }
  
  // Get sender of the original message
  const senderConnection = connections.get(senderId);
  if (senderConnection) {
    // Send read receipt to the original sender
    senderConnection.ws.send(JSON.stringify({
      type: 'read',
      conversationId,
      messageId,
      readBy: userId,
      readByName: connections.get(userId)?.name,
      timestamp: new Date().toISOString()
    }));
  }
}

// Send error message to a specific user
function sendErrorToUser(userId, message) {
  const connection = connections.get(userId);
  if (connection) {
    connection.ws.send(JSON.stringify({
      type: 'error',
      message
    }));
  }
}

// Send notification to a user
function sendNotification(userId, data) {
  const connection = connections.get(userId);
  if (connection) {
    connection.ws.send(JSON.stringify({
      type: 'notification',
      ...data,
      timestamp: new Date().toISOString()
    }));
  }
}

// Get online status of users
function getOnlineUsers(userIds) {
  return userIds.map(id => ({
    userId: id,
    isOnline: connections.has(id),
    lastSeen: new Date().toISOString() // This should come from a database in production
  }));
}

module.exports = {
  initializeWebSocket,
  sendNotification,
  getOnlineUsers
};