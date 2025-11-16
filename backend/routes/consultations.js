const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

// Get the Appointment model from appointments.js
const Appointment = mongoose.models.Appointment;

// Get ExtraDetailsPatients model
const ExtraDetailsPatients = mongoose.models.extradetailspatients; 

// @route   GET /api/consultations/upcoming/:userId
// @desc    Get upcoming consultations for a user (patient)
// @access  Public
router.get('/upcoming/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        msg: 'User ID is required'
      });
    }
    
    // Find all appointments for this patient
    const appointments = await Appointment.find({ 
      patientId: userId,
      status: { $in: ['requested', 'confirmed'] } // Only get requested or confirmed
    }).sort({ appointmentDate: -1 });
    
    // Map appointments to consultation format
    const consultations = appointments.map(appointment => ({
      id: appointment._id,
      doctor: appointment.doctorName || 'Doctor',
      specialty: appointment.doctorSpecialty || 'Healthcare Provider',
      date: new Date(appointment.appointmentDate || appointment.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: new Date(appointment.appointmentDate || appointment.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      type: appointment.type || 'virtual',
      status: appointment.status,
      notes: appointment.notes
    }));
    
    // Return consultations
    res.json({ 
      success: true,
      appointments: consultations
    });
  } catch (err) {
    console.error('Error fetching upcoming consultations:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/consultations/doctor/:doctorId
// @desc    Get all consultations for a doctor
// @access  Private
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    console.log('Looking up doctor data for ID:', doctorId);
    
    // Try to get all patients first, to debug the issue
    const allPatients = await ExtraDetailsPatients.find({}).limit(5);
    console.log('Sample of all patients in the database:', 
      allPatients.map(p => ({id: p._id, doctorId: p.doctorId, name: p.patientName}))
    );
    
    // Try multiple doctorId formats to handle string vs ObjectId issues
    const patientQueries = [
      { doctorId: doctorId }, // exact match
      { doctorId: new mongoose.Types.ObjectId(doctorId) }, // as ObjectId
      { doctorId: doctorId.toString() }, // as string
    ];
    
    let patients = [];
    for (const query of patientQueries) {
      try {
        console.log('Trying query:', JSON.stringify(query));
        const result = await ExtraDetailsPatients.find(query).sort({ appointmentRequestDate: -1 });
        console.log(`Query ${JSON.stringify(query)} returned ${result.length} results`);
        if (result.length > 0) {
          patients = result;
          break;
        }
      } catch (err) {
        console.log(`Query ${JSON.stringify(query)} failed:`, err.message);
      }
    }
    
    // Also get appointments
    let appointments = [];
    try {
      // Try as ObjectId
      appointments = await Appointment.find({ doctorId: doctorId })
        .sort({ appointmentDate: -1 });
      
      if (appointments.length === 0) {
        // Try as string
        appointments = await Appointment.find({ doctorId: doctorId.toString() })
          .sort({ appointmentDate: -1 });
      }
    } catch (err) {
      console.error('Error fetching appointments:', err.message);
    }
    
    console.log(`Found ${patients.length} patients and ${appointments.length} appointments for doctor ${doctorId}`);
    
    // Combine the data from both collections
    const combinedData = {
      appointments,
      patients
    };
    
    res.json({
      success: true,
      data: combinedData
    });
  } catch (err) {
    console.error('Error fetching doctor consultations:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: err.message
    });
  }
});

module.exports = router; 