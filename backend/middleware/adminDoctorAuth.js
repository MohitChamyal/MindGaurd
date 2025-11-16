const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

module.exports = async function(req, res, next) {
  // Get token from header, cookies, or query string
  const token = 
    req.header('x-auth-token') || 
    req.header('authorization')?.replace('Bearer ', '') || 
    req.cookies?.token ||
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
    
    // Check if there's an admin ID and role in the decoded token
    if (!decoded.id || decoded.role !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        msg: 'Invalid token or unauthorized role. Admin access required.' 
      });
    }

    // Find admin by ID
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        msg: 'Token is valid but admin no longer exists' 
      });
    }
    
    // Set admin in request object
    req.user = admin;
    req.user.id = admin._id.toString();
    req.user.role = 'admin';
    
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
    
    console.error('Admin authentication error:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Server authentication error' 
    });
  }
}; 