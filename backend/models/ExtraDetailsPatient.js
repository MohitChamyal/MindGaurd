const mongoose = require('mongoose');

const ExtraDetailsPatientSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
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
  patientEmail: {
    type: String,
    required: true,
    unique: true,
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
  appointmentRequestDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  medicalHistory: {
    type: String,
    default: ''
  },
  currentMedications: [{
    type: String
  }],
  allergies: [{
    type: String
  }],
  symptoms: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Add indexes for better query performance
ExtraDetailsPatientSchema.index({ patientEmail: 1 });
ExtraDetailsPatientSchema.index({ doctorId: 1 });
ExtraDetailsPatientSchema.index({ status: 1 });
ExtraDetailsPatientSchema.index({ createdAt: -1 });

module.exports = mongoose.model('extraDetailsPatient', ExtraDetailsPatientSchema); 