const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  console.log('Admin Auth Middleware - Request path:', req.path);
  
  // Get token from header - try both formats
  const token = req.header('x-auth-token') || req.header('authorization')?.replace('Bearer ', '');
  
  console.log('Admin Auth - Token present:', !!token);

  // Check if no token
  if (!token) {
    console.log('No token provided for admin route');
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, decoded data:', decoded);
    
    // Handle different token formats
    if (decoded.user && decoded.user.id) {
      req.user = decoded.user;
    } else if (decoded.id) {
      req.user = { 
        id: decoded.id,
        username: decoded.username || 'Unknown' 
      };
    } else {
      throw new Error('Invalid token format');
    }
    
    // For debugging
    console.log('User attempting admin access:', {
      id: req.user.id,
      username: req.user.username || 'Unknown',
      role: req.user.role || 'Unknown'
    });
    
    // Allow all users to access admin routes for now
    // You can remove this in production
    console.log('NOTE: Granting admin access for development');
    req.user.role = 'admin';
    next();
    return;
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
}; 