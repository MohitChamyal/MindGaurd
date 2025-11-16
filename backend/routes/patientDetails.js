const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

// Create a Mongoose schema for extradetailspatients
const extraDetailsSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  doctorSpecialty: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientAge: {
    type: String,
    required: true
  },
  patientGender: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    required: true
  },
  hasCompletedQuestionnaire: {
    type: Boolean,
    default: false
  },
  mentalHealthConcern: String,
  appointmentRequestDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['requested', 'confirmed', 'completed', 'cancelled'],
    default: 'requested'
  }
});

// Create the model for extradetailspatients
const ExtraDetailsPatients = mongoose.model('extradetailspatients', extraDetailsSchema);

// @route   GET /api/patient-details/doctor/:doctorId
// @desc    Get all patients who booked with a specific doctor
// @access  Private
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const patients = await ExtraDetailsPatients.find({ doctorId: req.params.doctorId })
      .sort({ appointmentRequestDate: -1 });
    
    res.json({ patients });
  } catch (err) {
    console.error('Error fetching patient details:', err.message);
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// @route   PUT /api/patient-details/:id
// @desc    Update patient status
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Find the patient record by ID
    const patient = await ExtraDetailsPatients.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ msg: 'Patient details not found' });
    }
    
    // Update status
    patient.status = status;
    await patient.save();
    
    res.json({
      success: true,
      msg: 'Patient status updated successfully',
      patient
    });
  } catch (err) {
    console.error('Error updating patient status:', err.message);
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

module.exports = router; 