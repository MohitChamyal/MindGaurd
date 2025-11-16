const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

// Create a Mongoose schema for appointments
const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: false
  },
  patientName: {
    type: String,
    required: true
  },
  patientEmail: {
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
  mentalHealthConcern: String,
  hasCompletedQuestionnaire: {
    type: Boolean,
    default: false
  },
  appointmentDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['requested', 'confirmed', 'completed', 'cancelled'],
    default: 'requested'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the Appointment model
const Appointment = mongoose.model('Appointment', appointmentSchema);

// Import the ExtraDetailsPatients model from mongoose - it's already defined in patientDetails.js
// We're using mongoose.models to access already registered models
const ExtraDetailsPatients = mongoose.models.extradetailspatients;

// @route   POST /api/appointments
// @desc    Create a new appointment request
// @access  Public (can be restricted with auth middleware if needed)
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/appointments - Request received');
    console.log('Request body:', req.body);
    
    const {
      doctorId,
      patientId,
      patientName,
      patientEmail,
      patientAge,
      patientGender,
      mentalHealthConcern,
      hasCompletedQuestionnaire,
      appointmentDate,
      doctorName,
      doctorSpecialty
    } = req.body;
    
    // Log all extracted values
    console.log('Extracted values:', {
      doctorId,
      patientId,
      patientName,
      patientEmail,
      patientAge,
      patientGender,
      mentalHealthConcern,
      hasCompletedQuestionnaire,
      appointmentDate,
      doctorName,
      doctorSpecialty
    });
    
    // Check if we have the required values
    if (!doctorId) {
      console.error('Missing doctorId');
      return res.status(400).json({
        success: false,
        msg: 'doctorId is required'
      });
    }
    
    // Convert doctorId to string if it's not already
    const doctorIdStr = String(doctorId);
    console.log(`Converting doctorId from ${doctorId} to string: ${doctorIdStr}`);
    
    // For patientId, we'll allow it to be optional for now
    if (!patientId) {
      console.warn('No patientId provided - this might cause issues');
    }
    
    if (!patientName) {
      console.error('Missing patientName');
      return res.status(400).json({
        success: false,
        msg: 'patientName is required'
      });
    }
    
    // Create a new appointment
    console.log('Creating appointment document');
    const appointment = new Appointment({
      doctorId: doctorIdStr,
      patientId: patientId || '000000000000000000000000', // Default ID if none provided
      patientName,
      patientEmail,
      patientAge,
      patientGender,
      mentalHealthConcern,
      hasCompletedQuestionnaire,
      appointmentDate,
      status: 'requested'
    });
    
    console.log('Saving appointment document');
    const savedAppointment = await appointment.save();
    console.log('Appointment saved successfully:', savedAppointment._id);
    console.log('Appointment doctorId saved as:', savedAppointment.doctorId, 'type:', typeof savedAppointment.doctorId);

    // Also create an entry in extradetailspatients collection
    console.log('Creating extradetailspatients document');
    const patientDetails = new ExtraDetailsPatients({
      doctorId: doctorIdStr, // Ensure doctorId is a string
      doctorName: doctorName || 'Doctor', // Use provided or default
      doctorSpecialty: doctorSpecialty || 'Healthcare Provider', // Use provided or default
      patientName,
      patientAge,
      patientGender,
      patientEmail,
      hasCompletedQuestionnaire,
      mentalHealthConcern,
      appointmentRequestDate: appointmentDate || new Date(),
      status: 'requested'
    });
    
    console.log('Saving extradetailspatients document');
    const savedPatientDetails = await patientDetails.save();
    console.log('Patient details saved successfully:', savedPatientDetails._id);
    console.log('Patient details doctorId saved as:', savedPatientDetails.doctorId, 'type:', typeof savedPatientDetails.doctorId);

    console.log('Appointment creation successful');
    res.status(201).json({
      success: true,
      msg: 'Appointment request created successfully',
      appointment: savedAppointment,
      patientDetails: savedPatientDetails
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    console.error('Error details:', err.message);
    if (err.name === 'ValidationError') {
      console.error('Validation error details:', err.errors);
    }
    res.status(500).json({ 
      success: false,
      msg: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/appointments/doctor/:doctorId
// @desc    Get all appointments for a specific doctor
// @access  Private (doctor only)
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    console.log(`Getting appointments for doctorId: ${doctorId}`);
    
    // Check if the authenticated user is the doctor
    if (req.user.role !== 'doctor' || req.user.id !== doctorId) {
      return res.status(403).json({ msg: 'Not authorized to view these appointments' });
    }

    // Try multiple formats of doctorId to handle possible inconsistencies
    const doctorIdStr = String(doctorId);
    
    // Query with string doctorId
    let appointments = await Appointment.find({ doctorId: doctorIdStr })
      .sort({ appointmentDate: -1 });
    
    console.log(`Found ${appointments.length} appointments with doctorId as string`);
    
    // If no results, try with ObjectId
    if (appointments.length === 0) {
      try {
        const objectIdDoctorId = new mongoose.Types.ObjectId(doctorId);
        const objectIdAppointments = await Appointment.find({ doctorId: objectIdDoctorId })
          .sort({ appointmentDate: -1 });
        
        console.log(`Found ${objectIdAppointments.length} appointments with doctorId as ObjectId`);
        
        if (objectIdAppointments.length > 0) {
          appointments = objectIdAppointments;
        }
      } catch (err) {
        console.log("Error trying ObjectId format:", err.message);
      }
    }

    res.json(appointments);
  } catch (err) {
    console.error('Error fetching doctor appointments:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/appointments/patient/:patientId
// @desc    Get all appointments for a specific patient
// @access  Private (patient only)
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    // Check if the authenticated user is the patient
    if (req.user.id !== req.params.patientId) {
      return res.status(403).json({ msg: 'Not authorized to view these appointments' });
    }

    const appointments = await Appointment.find({ patientId: req.params.patientId })
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (err) {
    console.error('Error fetching patient appointments:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment status
// @access  Private (doctor only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Check if the authenticated user is the doctor for this appointment
    if (req.user.role !== 'doctor' || req.user.id !== appointment.doctorId.toString()) {
      return res.status(403).json({ msg: 'Not authorized to update this appointment' });
    }

    // Update appointment
    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;

    await appointment.save();

    res.json({
      success: true,
      msg: 'Appointment updated successfully',
      appointment
    });
  } catch (err) {
    console.error('Error updating appointment:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = { router, Appointment };