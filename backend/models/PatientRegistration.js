const mongoose = require('mongoose');

const patientRegistrationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Doctor'
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
  patientEmail: {
    type: String,
    required: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  patientAge: {
    type: String,
    required: true
  },
  patientGender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  medicalHistory: {
    type: String,
    default: ''
  },
  currentMedications: {
    type: [String],
    default: []
  },
  allergies: {
    type: [String],
    default: []
  },
  symptoms: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  registrationType: {
    type: String,
    enum: ['consultation_request', 'doctor_initiated'],
    default: 'consultation_request'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
patientRegistrationSchema.index({ patientId: 1, doctorId: 1 });
patientRegistrationSchema.index({ status: 1 });
patientRegistrationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PatientRegistration', patientRegistrationSchema); 