const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');
const doctorAuth = require('../middleware/doctorAuth');
const bcrypt = require('bcryptjs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only .pdf, .jpg, .jpeg, .png files are allowed!'));
    }
  }
});

// Register a new doctor
router.post('/register', upload.fields([
  { name: 'documents[licenseFile]', maxCount: 1 },
  { name: 'documents[degreeFile]', maxCount: 1 },
  { name: 'documents[idProofFile]', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
      licenseNumber,
      specialization,
      yearsOfExperience,
      hospital,
      address
    } = req.body;

    // Check if doctor already exists
    let doctor = await Doctor.findOne({ email });
    if (doctor) {
      return res.status(400).json({ msg: 'Doctor already exists' });
    }

    // Handle file paths
    const documents = {};
    if (req.files) {
      if (req.files['documents[licenseFile]']) {
        documents.licenseFile = req.files['documents[licenseFile]'][0].path;
      }
      if (req.files['documents[degreeFile]']) {
        documents.degreeFile = req.files['documents[degreeFile]'][0].path;
      }
      if (req.files['documents[idProofFile]']) {
        documents.idProofFile = req.files['documents[idProofFile]'][0].path;
      }
    }

    // Create new doctor
    doctor = new Doctor({
      fullName,
      email,
      password,
      phoneNumber,
      licenseNumber,
      specialization,
      yearsOfExperience,
      hospital,
      address: JSON.parse(address),
      documents
    });

    await doctor.save();

    // Create JWT token
    const token = jwt.sign(
      { id: doctor._id, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        email: doctor.email,
        isVerified: doctor.isVerified
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// Login doctor
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if doctor exists
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if password is already in bcrypt format
    const isHashed = doctor.password.startsWith('$2a$') || doctor.password.startsWith('$2b$');
    
    // If not hashed (legacy case), compare directly
    let isMatch = false;
    
    if (isHashed) {
      // Verify password using bcrypt
      isMatch = await bcrypt.compare(password, doctor.password);
    } else {
      // Legacy case - direct comparison (not secure!)
      isMatch = (password === doctor.password);
      
      // If match, upgrade to hashed password for future
      if (isMatch) {
        const salt = await bcrypt.genSalt(10);
        doctor.password = await bcrypt.hash(password, salt);
        await doctor.save();
        console.log(`Upgraded password hash for doctor: ${doctor.email}`);
      }
    }

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT token with consistent format
    const token = jwt.sign(
      { id: doctor._id.toString(), role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Add consistent response format
    res.json({
      success: true,
      token,
      doctor: {
        id: doctor._id.toString(),
        fullName: doctor.fullName,
        email: doctor.email,
        isVerified: doctor.isVerified
      }
    });
  } catch (err) {
    console.error('Doctor login error:', err.message);
    res.status(500).json({
      success: false,
      msg: 'Server error during login',
      error: err.message
    });
  }
});

// Get doctor profile
router.get('/profile', doctorAuth, async (req, res) => {
  try {
    // No need to query again since middleware already populated req.user
    res.json(req.user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 