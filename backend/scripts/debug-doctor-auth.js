/**
 * Debug Authentication Script for MindGuard Doctors
 * 
 * This script helps diagnose authentication issues for doctors by testing the login process
 * and inspecting doctor records directly from the database.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');

// Command line arguments
const email = process.argv[2];
const testPassword = process.argv[3]; // Optional: test a specific password

if (!email) {
  console.error('❌ Please provide an email address to debug');
  console.error('Usage: node scripts/debug-doctor-auth.js doctor@example.com [password-to-test]');
  process.exit(1);
}

async function debugDoctorAuth() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find doctor by email
    console.log(`🔍 Looking for doctor with email: ${email}`);
    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      console.error('❌ Doctor not found in database');
      console.log('💡 Check if:');
      console.log('   1. The email address is spelled correctly');
      console.log('   2. The doctor account has been created');
      return;
    }

    console.log('✅ Doctor found in database');
    console.log('📋 Doctor details:');
    console.log(`   ID: ${doctor._id}`);
    console.log(`   Name: ${doctor.fullName}`);
    console.log(`   Email: ${doctor.email}`);
    console.log(`   Verification Status: ${doctor.isVerified ? 'Verified' : 'Not Verified'}`);
    
    if (!doctor.isVerified) {
      console.log('\n⚠️ This doctor account is not verified yet');
      console.log('   Verification is required before the doctor can login and access the system');
    }
    
    // Check password format and hashing
    console.log('\n🔍 Analyzing password storage:');
    
    if (!doctor.password) {
      console.error('❌ Doctor does not have a password set');
      return;
    }
    
    const isHashed = doctor.password.startsWith('$2a$') || doctor.password.startsWith('$2b$');
    
    if (isHashed) {
      console.log('✅ Password is properly hashed with bcrypt');
      console.log('   Hash format is correct');
      
      if (testPassword) {
        console.log('\n🔍 Testing provided password:');
        try {
          const isMatch = await bcrypt.compare(testPassword, doctor.password);
          if (isMatch) {
            console.log('✅ Password is correct! Authentication should work.');
          } else {
            console.log('❌ Password does not match. Verify the password is correct.');
          }
        } catch (err) {
          console.log('❌ Error comparing passwords:', err.message);
        }
      }
    } else {
      console.log('⚠️ Password appears to be stored in plain text');
      console.log('   Length:', doctor.password.length);
      console.log('   First few chars:', doctor.password.substring(0, 3) + '...');
      console.log('\n⚠️ This is a security risk - passwords should be hashed');
      console.log('   Run the following to fix this doctor:');
      console.log('   1. npm run rehash-doctor-passwords');
      
      if (testPassword) {
        console.log('\n🔍 Testing provided password:');
        if (testPassword === doctor.password) {
          console.log('✅ Password matches (plain text comparison)');
        } else {
          console.log('❌ Password does not match.');
        }
      }
    }
    
    console.log('\n💡 Login issue troubleshooting:');
    console.log('1. Make sure the login form is sending to the correct endpoint (/api/auth/doctor/login)');
    console.log('2. Check for CORS issues in browser console');
    console.log('3. Ensure the doctor account is verified (isVerified = true)');
    console.log('4. Verify JWT token generation is working properly');
    
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

debugDoctorAuth(); 