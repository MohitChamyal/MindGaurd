const jwt = require('jsonwebtoken');
const fs = require('fs');
const User = require('../models/User');

/**
 * Authentication middleware for verifying user tokens
 * This middleware can be used on protected routes
 */
module.exports = async function(req, res, next) {
  // Allow access if userId is provided in query params (mainly for profile lookup)
  if (req.path === '/profile' && req.query.userId) {
    return next();
  }
  
  // Get token from various possible sources
  const token = 
    req.header('x-auth-token') ||
    req.header('Authorization')?.replace('Bearer ', '') || 
    req.cookies?.token ||
    req.body?.token || 
    req.query?.token;

  // Check if token exists
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      msg: 'No authentication token, access denied' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if there's a user ID in the decoded token
    if (!decoded.id && !decoded.user?.id) {
      return res.status(401).json({ 
        success: false, 
        msg: 'Invalid token format' 
      });
    }

    // Get user ID from token (handling different token formats)
    const userId = decoded.id || decoded.user.id;
    
    // Find user by ID
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        msg: 'Token is valid but user no longer exists' 
      });
    }
    
    // Set user in request object
    req.user = user;
    req.user.id = user._id.toString(); // Ensure ID is consistent
    req.userId = user._id.toString();
    
    next();
  } catch (err) {
    // Handle different JWT errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        msg: 'Token expired, please login again' 
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        msg: 'Invalid token, please login again' 
      });
    }
    
    console.error('Authentication error:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Server authentication error' 
    });
  }
};

function storeDataInJson(input, output, filePath = 'data.json') {
    try {
        // Read existing data
        let data = [];
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath);
            data = JSON.parse(fileData);
        }

        // Append new input and output
        console.log('Input data:', input);
        console.log('Output data:', output);
        data.push({ input, output });

        // Write updated data back to the file
        console.log(`Writing data to ${filePath}`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        console.log(`Data successfully written to ${filePath}`);
    } catch (error) {
        console.error(`Error writing to file ${filePath}:`, error);
    }
} 