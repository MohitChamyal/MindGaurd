const express = require('express');
const router = express.Router();
const PatientRegistration = require('../models/PatientRegistration');
const auth = require('../middleware/auth');
const doctorAuth = require('../middleware/doctorAuth');

// Create a new patient registration
router.post('/', auth, async (req, res) => {
  try {
    const {
      patientId,
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

    // Create new registration
    const registration = new PatientRegistration({
      patientId,
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

    await registration.save();

    res.status(201).json({
      success: true,
      data: registration,
      message: 'Registration submitted successfully'
    });
  } catch (error) {
    console.error('Error in patient registration:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting registration',
      error: error.message
    });
  }
});

// Get all registrations for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const registrations = await PatientRegistration.find({
      patientId: req.params.patientId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
});

// Get all registrations for a doctor
router.get('/doctor/:doctorId', doctorAuth, async (req, res) => {
  try {
    const registrations = await PatientRegistration.find({
      doctorId: req.params.doctorId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
});

// Update registration status
router.patch('/:id/status', doctorAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Validate doctor permission
    const registration = await PatientRegistration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    // Get doctor ID from authenticated user
    const doctorId = req.user.id;
    
    // Make sure the doctor is updating their own registrations
    if (registration.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this registration'
      });
    }

    // Update the registration
    registration.status = status;
    await registration.save();

    res.json({
      success: true,
      data: registration,
      message: 'Registration status updated successfully'
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating registration status',
      error: error.message
    });
  }
});

// Get all patient registrations for a doctor with filtering and sorting
router.get('/doctor-patients', doctorAuth, async (req, res) => {
  try {
    const { status, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10, doctorId: queryDoctorId } = req.query;
    
    // First try to get doctorId from query parameter (explicitly passed from frontend)
    // If not available, fall back to the ID from auth middleware
    const doctorId = queryDoctorId || req.user.id;
    console.log('Using doctorId:', doctorId, 'Source:', queryDoctorId ? 'query parameter' : 'auth middleware');

    // Build query
    const query = { doctorId };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    console.log('Query:', JSON.stringify(query));

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count for pagination
    const total = await PatientRegistration.countDocuments(query);
    console.log('Total documents:', total);

    // Fetch registrations with pagination and sorting
    const registrations = await PatientRegistration.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found registrations:', registrations.length);

    res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          hasMore: skip + registrations.length < total
        }
      },
      message: 'Patient registrations retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient registrations',
      error: error.message
    });
  }
});

// Get registration statistics for a doctor
router.get('/doctor-stats', doctorAuth, async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Get counts by status
    const stats = await PatientRegistration.aggregate([
      { $match: { doctorId: doctorId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent registrations
    const recentRegistrations = await PatientRegistration.find({ doctorId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Format stats into an object
    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({
      success: true,
      data: {
        stats: formattedStats,
        recentRegistrations
      },
      message: 'Registration statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching doctor statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registration statistics',
      error: error.message
    });
  }
});

module.exports = router;