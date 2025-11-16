/**
 * Password Rehash Script for MindGuard Doctors
 * 
 * This script finds all doctors with plaintext passwords and rehashes them.
 * Run this after fixing the authentication system to ensure all doctors
 * have properly hashed passwords.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');

async function rehashDoctorPasswords() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find all doctors
    console.log('🔍 Fetching all doctors...');
    const doctors = await Doctor.find({});
    console.log(`✅ Found ${doctors.length} doctors`);

    let rehashed = 0;
    let alreadyHashed = 0;
    let errors = 0;

    // Process each doctor
    for (const doctor of doctors) {
      const isHashed = doctor.password.startsWith('$2a$') || doctor.password.startsWith('$2b$');
      
      if (!isHashed) {
        console.log(`🔄 Rehashing password for doctor: ${doctor.email}`);
        try {
          const plainPassword = doctor.password; // Store the plain password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(plainPassword, salt);
          
          // Update the doctor with hashed password
          await Doctor.findByIdAndUpdate(doctor._id, { password: hashedPassword });
          console.log(`✅ Successfully rehashed password for ${doctor.email}`);
          rehashed++;
        } catch (error) {
          console.error(`❌ Error rehashing password for ${doctor.email}:`, error.message);
          errors++;
        }
      } else {
        console.log(`✓ Password for ${doctor.email} is already hashed`);
        alreadyHashed++;
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`Total doctors: ${doctors.length}`);
    console.log(`Already hashed: ${alreadyHashed}`);
    console.log(`Rehashed: ${rehashed}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
      console.log('🔄 MongoDB connection closed');
    }
  }
}

rehashDoctorPasswords(); 