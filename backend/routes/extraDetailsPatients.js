const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const doctorAuth = require('../middleware/doctorAuth');
const ExtraDetailsPatient = require('../models/ExtraDetailsPatient');
const { check, validationResult } = require('express-validator');

// Get routes can still use the ExtraDetailsPatient model directly
router.get('/', doctorAuth, async (req, res) => {
  try {
    const { status } = req.query;
    // Get doctorId from auth middleware
    const doctorId = req.user.id;
    
    console.log('Looking up patients for doctor ID:', doctorId, status ? `with status: ${status}` : '');
    
    // Build the query
    let query = { doctorId: doctorId };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Find matching patients
    const patients = await ExtraDetailsPatient.find(query)
      .sort({ appointmentRequestDate: -1 });
    
    console.log(`Query with doctorId: ${doctorId} returned ${patients.length} patients`);
    
    // Ensure all patients have the complete data structure
    const formattedPatients = patients.map(patient => ({
      _id: patient._id,
      doctorId: patient.doctorId,
      doctorName: patient.doctorName || '',
      doctorSpecialty: patient.doctorSpecialty || '',
      patientName: patient.patientName || '',
      patientEmail: patient.patientEmail || '',
      patientAge: patient.patientAge || '',
      patientGender: patient.patientGender || '',
      appointmentRequestDate: patient.appointmentRequestDate || patient.createdAt,
      status: patient.status || 'pending',
      // Include medical details
      medicalHistory: patient.medicalHistory || '',
      currentMedications: patient.currentMedications || [],
      allergies: patient.allergies || [],
      symptoms: patient.symptoms || '',
      notes: patient.notes || '',
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    }));
    
    res.json(formattedPatients);
  } catch (err) {
    console.error('Error in doctor patients route:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/extra-details-patients/doctor/:doctorId
// @desc    Get all patients from extraDetailsPatients collection for a specific doctor
// @access  Private
router.get('/doctor/:doctorId', doctorAuth, async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const { status } = req.query;
    
    console.log('Looking up patients for doctor ID:', doctorId, status ? `with status: ${status}` : '');
    
    // Build the query
    let query = { doctorId: doctorId };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Try with exact ID
    let patients = await ExtraDetailsPatient.find(query)
      .sort({ appointmentRequestDate: -1 });
    
    console.log(`Query with doctorId: ${doctorId} returned ${patients.length} patients`);
    
    // Ensure all patients have the complete data structure
    const formattedPatients = patients.map(patient => ({
      _id: patient._id,
      doctorId: patient.doctorId,
      doctorName: patient.doctorName || '',
      doctorSpecialty: patient.doctorSpecialty || '',
      patientName: patient.patientName || '',
      patientEmail: patient.patientEmail || '',
      patientAge: patient.patientAge || '',
      patientGender: patient.patientGender || '',
      hasCompletedQuestionnaire: patient.hasCompletedQuestionnaire || false,
      mentalHealthConcern: patient.mentalHealthConcern || '',
      appointmentRequestDate: patient.appointmentRequestDate || patient.createdAt,
      status: patient.status || 'pending',
      // Include medical details
      medicalHistory: patient.medicalHistory || '',
      currentMedications: patient.currentMedications || [],
      allergies: patient.allergies || [],
      symptoms: patient.symptoms || '',
      notes: patient.notes || '',
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    }));
    
    res.json(formattedPatients);
  } catch (err) {
    console.error('Error in /api/extra-details-patients/doctor/:doctorId route:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: err.message
    });
  }
});

// @route   GET api/patient-details/:id
// @desc    Get patient details by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await ExtraDetailsPatient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient details not found' });
    }

    // Log the found patient data for debugging
    console.log("Found patient data:", {
      id: patient._id,
      patientName: patient.patientName,
      medicalHistory: patient.medicalHistory,
      currentMedications: patient.currentMedications,
      allergies: patient.allergies,
      symptoms: patient.symptoms,
      notes: patient.notes
    });

    // Ensure all fields are included in the response
    const responseData = {
      _id: patient._id,
      doctorId: patient.doctorId,
      patientName: patient.patientName || '',
      patientEmail: patient.patientEmail || '',
      patientAge: patient.patientAge || '',
      patientGender: patient.patientGender || '',
      medicalHistory: patient.medicalHistory || '',
      currentMedications: patient.currentMedications || [],
      allergies: patient.allergies || [],
      symptoms: patient.symptoms || '',
      notes: patient.notes || '',
      status: patient.status || 'pending',
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    };

    res.json({ patient: responseData });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Patient details not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/patient-details/:id
// @desc    Update patient status
// @access  Private
router.put('/:id', [
  auth,
  [
    check('status', 'Status is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { status } = req.body;

  try {
    let patient = await ExtraDetailsPatient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient details not found' });
    }

    // Update patient status
    patient.status = status;
    await patient.save();

    res.json({ patient });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Patient details not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/extra-details-patients
// @desc    Add a new patient to the extradetailspatients collection
// @access  Public
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/extra-details-patients - Request received');
    console.log('Request body:', req.body);
    
    const {
      doctorId,
      doctorName,
      doctorSpecialty,
      patientName,
      patientEmail,
      patientAge,
      patientGender,
      medicalHistory,
      currentMedications,
      allergies,
      symptoms,
      notes
    } = req.body;
    
    // Log all extracted values
    console.log('Extracted values:', {
      doctorId,
      doctorName,
      doctorSpecialty,
      patientName,
      patientEmail,
      patientAge,
      patientGender,
      medicalHistory,
      currentMedications,
      allergies,
      symptoms,
      notes
    });
    
    // Validate required fields
    if (!doctorId) {
      console.error('Missing doctorId');
      return res.status(400).json({
        success: false,
        msg: 'doctorId is required'
      });
    }
    
    if (!patientName) {
      console.error('Missing patientName');
      return res.status(400).json({
        success: false,
        msg: 'patientName is required'
      });
    }
    
    if (!patientEmail) {
      console.error('Missing patientEmail');
      return res.status(400).json({
        success: false,
        msg: 'patientEmail is required'
      });
    }
    
    // Try to convert doctorId to ObjectId if possible
    let formattedDoctorId = doctorId;
    try {
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        formattedDoctorId = new mongoose.Types.ObjectId(doctorId);
      }
    } catch (err) {
      console.log('Error converting doctorId to ObjectId, will use string value:', err.message);
    }
    
    // Check if a patient with the same email already exists under this doctor
    const existingPatient = await ExtraDetailsPatient.findOne({
      doctorId: formattedDoctorId,
      patientEmail: patientEmail
    });
    
    if (existingPatient) {
      // If the patient already exists, update their record instead
      console.log('Patient with email already exists for this doctor, updating record');
      
      existingPatient.patientName = patientName;
      existingPatient.patientAge = patientAge || existingPatient.patientAge;
      existingPatient.patientGender = patientGender || existingPatient.patientGender;
      existingPatient.doctorName = doctorName || existingPatient.doctorName;
      existingPatient.doctorSpecialty = doctorSpecialty || existingPatient.doctorSpecialty;
      existingPatient.medicalHistory = medicalHistory || existingPatient.medicalHistory;
      existingPatient.currentMedications = Array.isArray(currentMedications) 
        ? currentMedications 
        : (currentMedications ? [currentMedications] : existingPatient.currentMedications);
      existingPatient.allergies = Array.isArray(allergies) 
        ? allergies 
        : (allergies ? [allergies] : existingPatient.allergies);
      existingPatient.symptoms = symptoms || existingPatient.symptoms;
      existingPatient.notes = notes || existingPatient.notes;
      existingPatient.status = 'accepted'; // Set status to accepted for doctor-initiated update
      
      await existingPatient.save();
      
      console.log('Patient record updated successfully with status: accepted');
      
      return res.json({
        success: true,
        msg: 'Patient record updated successfully',
        status: 'success',
        patientDetails: existingPatient
      });
    }
    
    // Create a new patient record
    const patientDetails = new ExtraDetailsPatient({
      doctorId: formattedDoctorId,
      doctorName: doctorName || 'Doctor',
      doctorSpecialty: doctorSpecialty || 'Specialist',
      patientName,
      patientEmail,
      patientAge: patientAge || '',
      patientGender: patientGender || 'other',
      medicalHistory: medicalHistory || '',
      currentMedications: Array.isArray(currentMedications) ? currentMedications : (currentMedications ? [currentMedications] : []),
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      symptoms: symptoms || '',
      notes: notes || '',
      appointmentRequestDate: new Date(),
      status: 'accepted' // Set status to accepted for doctor-initiated creation
    });
    
    console.log('Saving new patient record');
    const savedPatientDetails = await patientDetails.save();
    console.log('Patient details saved successfully:', savedPatientDetails._id);

    console.log('Patient details doctorId saved as:', savedPatientDetails.doctorId, 'type:', typeof savedPatientDetails.doctorId);
    
    // Log the saved data for debugging
    console.log('Saved patient data includes:', {
      patientName: savedPatientDetails.patientName,
      hasMentalHealthConcern: !!savedPatientDetails.mentalHealthConcern,
      hasMedicalHistory: !!savedPatientDetails.medicalHistory,
      medicationsCount: savedPatientDetails.currentMedications?.length || 0,
      allergiesCount: savedPatientDetails.allergies?.length || 0,
      hasSymptoms: !!savedPatientDetails.symptoms,
      hasNotes: !!savedPatientDetails.notes
    });
    
    // Return success response
    res.status(201).json({
      success: true,
      msg: 'Patient details created successfully',
      status: 'success',
      patientDetails: savedPatientDetails
    });
  } catch (err) {
    console.error('Error creating patient details:', err);
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

// @route   DELETE api/extra-details-patients/:id
// @desc    Delete a patient record
// @access  Private (Doctors only)
router.delete('/:id', doctorAuth, async (req, res) => {
  try {
    // Find the patient record
    const patient = await ExtraDetailsPatient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient record not found' 
      });
    }

    // Check if the doctor is authorized to delete this patient
    const doctorId = req.user.id;
    console.log(`Doctor ${doctorId} attempting to delete patient ${req.params.id}`);
    
    if (patient.doctorId && patient.doctorId.toString() !== doctorId.toString()) {
      console.log('Authorization failed: Doctor IDs do not match');
      console.log('Patient doctorId:', patient.doctorId);
      console.log('Request doctorId:', doctorId);
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized to delete this patient record' 
      });
    }

    // Delete the patient record
    await ExtraDetailsPatient.findByIdAndDelete(req.params.id);
    
    console.log(`Patient ${req.params.id} deleted successfully by doctor ${doctorId}`);
    
    res.json({ 
      success: true,
      message: 'Patient record deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting patient record:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Patient record not found' 
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

module.exports = router; 