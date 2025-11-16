const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

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
    
    // Log decoded token for debugging
    console.log('Doctor Auth - Decoded token:', decoded);
    
    // Extract doctor ID from token - handle different token formats
    let doctorId = null;
    
    // Option 1: Standard format with role
    if (decoded.id && decoded.role === 'doctor') {
      doctorId = decoded.id;
    } 
    // Option 2: Format without role but with ID
    else if (decoded.id) {
      doctorId = decoded.id;
    }
    // Option 3: User object in token
    else if (decoded.user && decoded.user.id) {
      doctorId = decoded.user.id;
    }
    
    if (!doctorId) {
      return res.status(401).json({ 
        success: false, 
        msg: 'Invalid token format or missing doctor ID' 
      });
    }

    // Find doctor by ID
    const doctor = await Doctor.findById(doctorId).select('-password');
    
    if (!doctor) {
      return res.status(401).json({ 
        success: false, 
        msg: 'Token is valid but doctor not found with ID: ' + doctorId 
      });
    }
    
    // Check if doctor is verified (skip for development if needed)
    if (!doctor.isVerified && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        msg: 'Your account is pending verification. Please wait for admin approval.'
      });
    }
    
    // Set doctor in request object
    req.user = doctor;
    req.user.id = doctor._id.toString();
    req.user.role = 'doctor';
    req.doctorId = doctor._id.toString(); // Add explicit doctorId property
    
    console.log('Doctor authentication successful for:', {
      id: doctor._id.toString(),
      email: doctor.email
    });
    
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
    
    console.error('Doctor authentication error:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Server authentication error' 
    });
  }
}; 