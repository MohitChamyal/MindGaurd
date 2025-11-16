const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

// @route   GET /api/doctors
// @desc    Get all registered doctors
// @access  Public
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .select('-password') // Don't send passwords
      .sort({ createdAt: -1 }); // Sort by most recently registered first

    res.json(doctors);
  } catch (err) {
    console.error('Error fetching doctors:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password');
    
    if (!doctor) {
      return res.status(404).json({ msg: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (err) {
    console.error('Error fetching doctor:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Doctor not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   GET /api/doctors/available
// @desc    Get all verified doctors
// @access  Public
router.get('/available/all', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isVerified: true })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(doctors);
  } catch (err) {
    console.error('Error fetching verified doctors:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 