const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get user profile - can fetch either by auth token or by userId parameter
router.get('/profile', auth, async (req, res) => {
  try {
    let userId;
    
    // If userId is provided in query params, use that instead
    // This allows admin routes or direct lookups
    if (req.query.userId) {
      userId = req.query.userId;
    } else if (req.user && req.user.id) {
      // Otherwise use the authenticated user's ID
      userId = req.user.id;
    } else {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if the user has a name, if not, use username or email
    if (!user.name && user.username) {
      user.name = user.username;
    } else if (!user.name && user.email) {
      // Use the part before @ as a name if email exists
      user.name = user.email.split('@')[0];
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Get user by email - needed for doctor-initiated patient registration
router.get('/by-email', auth, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email parameter is required' 
      });
    }
    
    // Check if the requester is a doctor (only doctors should be able to look up users by email)
    if (!req.user.isDoctor && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only doctors or admins can look up users by email'
      });
    }
    
    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with the provided email'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Error finding user by email:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
});

// Get user registrations for analytics dashboard
router.get('/registrations', auth, async (req, res) => {
  try {
    // Check if user has admin permissions
    if (!req.user.isAdmin && !req.user.isDoctor) {
      return res.status(403).json({ error: 'Unauthorized access to user registrations' });
    }
    
    // Parse date range from query parameters
    const { startDate, endDate } = req.query;
    
    // Create date filters
    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
    }
    
    // Query for user registrations within the date range
    const users = await User.find(dateFilter)
      .select('_id createdAt name email username')
      .sort({ createdAt: 1 });
    
    // Format the response
    const registrations = users.map(user => ({
      userId: user._id,
      registrationDate: user.createdAt,
      name: user.name || user.username || user.email.split('@')[0]
    }));
    
    // Get therapist registrations for the same period (if needed)
    const therapistRegistrations = await User.find({
      ...dateFilter,
      isDoctor: true
    }).countDocuments();
    
    res.json({
      registrations,
      therapists: therapistRegistrations,
      count: registrations.length
    });
  } catch (err) {
    console.error('Error fetching user registrations:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Add or update user subscription
router.post('/subscription', auth, async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    
    // Validate request data
    if (!subscription || !subscription.plan || !subscription.status) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Ensure the user making the request is either the user being updated or an admin
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to update this user\'s subscription' });
    }

    // Find and update the user's subscription
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update subscription details
    user.subscription = {
      ...user.subscription,
      ...subscription
    };

    // Save the updated user
    await user.save();

    // Return the updated subscription
    res.json({ 
      success: true, 
      message: 'Subscription updated successfully',
      subscription: user.subscription
    });
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Get user subscription
router.get('/subscription', auth, async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;

    // Ensure the user making the request is either the user whose subscription is being retrieved or an admin
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to view this user\'s subscription' });
    }

    // Find the user
    const user = await User.findById(userId).select('subscription');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the subscription
    res.json({ 
      success: true,
      subscription: user.subscription || {
        plan: 'free',
        status: 'inactive'
      }
    });
  } catch (err) {
    console.error('Error fetching subscription:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

module.exports = router;