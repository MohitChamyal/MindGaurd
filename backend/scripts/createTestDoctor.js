const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

const createTestDoctor = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Check if test doctor already exists
    const existingDoctor = await Doctor.findOne({ email: 'doctor@mindguard.com' });

    if (existingDoctor) {
      console.log('Test doctor already exists');
      console.log('Email: doctor@mindguard.com');
      console.log('Password: doctor123');
      return;
    }

    // Create test doctor account
    const testDoctor = new Doctor({
      fullName: 'Dr. Test Doctor',
      email: 'doctor@mindguard.com',
      password: 'doctor123', // This will be hashed by the pre-save hook
      phoneNumber: '+1234567890',
      licenseNumber: 'TEST123456',
      specialization: 'Psychiatry',
      yearsOfExperience: 10,
      hospital: 'MindGuard Test Hospital',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        zipCode: '12345'
      },
      isVerified: true // Pre-verify for testing
    });

    await testDoctor.save();

    console.log('✅ Test doctor account created successfully!');
    console.log('Email: doctor@mindguard.com');
    console.log('Password: doctor123');
    console.log('License: TEST123456');
    console.log('Specialization: Psychiatry');
    console.log('Verified: Yes');

  } catch (error) {
    console.error('❌ Error creating test doctor:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

createTestDoctor();
