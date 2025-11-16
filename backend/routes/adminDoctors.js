const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const adminDoctorAuth = require('../middleware/adminDoctorAuth');

// @route   GET /api/admin/doctors
// @desc    Get all doctors (for admin)
// @access  Admin only
router.get('/', adminDoctorAuth, async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(doctors);
  } catch (err) {
    console.error('Error fetching doctors for admin:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/doctors/pending
// @desc    Get all doctors pending verification
// @access  Admin only
router.get('/pending', adminDoctorAuth, async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ isVerified: false })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(pendingDoctors);
  } catch (err) {
    console.error('Error fetching pending doctors:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/admin/doctors/:id/verify
// @desc    Verify a doctor
// @access  Admin only
router.put('/:id/verify', adminDoctorAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ msg: 'Doctor not found' });
    }
    
    // Update verification status
    doctor.isVerified = true;
    await doctor.save();
    
    res.json({ 
      success: true,
      msg: 'Doctor verified successfully',
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        email: doctor.email,
        isVerified: doctor.isVerified
      }
    });
  } catch (err) {
    console.error('Error verifying doctor:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Doctor not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/admin/doctors/:id/reject
// @desc    Reject a doctor application
// @access  Admin only
router.put('/:id/reject', adminDoctorAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ msg: 'Doctor not found' });
    }
    
    // Delete the doctor account if it's rejected
    await Doctor.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true,
      msg: 'Doctor application rejected and removed'
    });
  } catch (err) {
    console.error('Error rejecting doctor application:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Doctor not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/admin/doctors/:id
// @desc    Delete a doctor account
// @access  Admin only
router.delete('/:id', adminDoctorAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ msg: 'Doctor not found' });
    }
    
    await Doctor.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true,
      msg: 'Doctor account deleted'
    });
  } catch (err) {
    console.error('Error deleting doctor account:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Doctor not found' });
    }
    
    res.status(500).send('Server error');
  }
});

module.exports = router; 