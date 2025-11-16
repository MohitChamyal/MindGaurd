/**
 * Debug Authentication Script for MindGuard
 * 
 * This script helps diagnose authentication issues by testing the login process
 * and inspecting user records directly from the database.
 * Supports debugging regular users, doctors, and admins.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');

// Command line arguments
const userType = process.argv[2]; // user, doctor, or admin
const email = process.argv[3];
const testPassword = process.argv[4]; // Optional: test a specific password

if (!userType || !email) {
  console.error('❌ Please provide a user type and email address to debug');
  console.error('Usage: node scripts/debug-auth.js [user|doctor|admin] user@example.com [password-to-test]');
  process.exit(1);
}

if (!['user', 'doctor', 'admin'].includes(userType)) {
  console.error('❌ Invalid user type. Must be one of: user, doctor, admin');
  process.exit(1);
}

async function debugAuth() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find account by email and type
    console.log(`🔍 Looking for ${userType} with email: ${email}`);
    
    let account;
    
    switch(userType) {
      case 'user':
        account = await User.findOne({ email });
        break;
      case 'doctor':
        account = await Doctor.findOne({ email });
        break;
      case 'admin':
        account = await Admin.findOne({ email });
        break;
    }

    if (!account) {
      console.error(`❌ ${userType} not found in database`);
      console.log('💡 Check if:');
      console.log('   1. The email address is spelled correctly');
      console.log('   2. The account has been created');
      console.log('   3. You are using the correct user type');
      return;
    }

    console.log(`✅ ${userType} found in database`);
    console.log('📋 Account details:');
    console.log(`   ID: ${account._id}`);
    
    // Display type-specific information
    if (userType === 'user') {
      console.log(`   Username: ${account.username}`);
    } else if (userType === 'doctor') {
      console.log(`   Full Name: ${account.fullName}`);
      console.log(`   Specialization: ${account.specialization}`);
      console.log(`   Verified: ${account.isVerified ? 'Yes' : 'No'}`);
    } else if (userType === 'admin') {
      console.log(`   Full Name: ${account.fullName || 'Not set'}`);
      console.log(`   Role: ${account.role || 'Standard Admin'}`);
    }
    
    console.log(`   Email: ${account.email}`);
    
    // Check password format and hashing
    console.log('\n🔍 Analyzing password storage:');
    
    if (!account.password) {
      console.error('❌ Account does not have a password set');
      return;
    }
    
    const isHashed = account.password.startsWith('$2a$') || account.password.startsWith('$2b$');
    
    if (isHashed) {
      console.log('✅ Password is properly hashed with bcrypt');
      console.log('   Hash format is correct');
      
      if (testPassword) {
        console.log('\n🔍 Testing provided password:');
        try {
          let isMatch = false;
          
          if (userType === 'doctor' || userType === 'admin') {
            // Use the model's comparePassword method if it exists
            if (typeof account.comparePassword === 'function') {
              isMatch = await account.comparePassword(testPassword);
            } else {
              isMatch = await bcrypt.compare(testPassword, account.password);
            }
          } else {
            // Regular user
            isMatch = await bcrypt.compare(testPassword, account.password);
          }
          
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
      console.log('   Length:', account.password.length);
      console.log('   First few chars:', account.password.substring(0, 3) + '...');
      console.log('\n⚠️ This is a security risk - passwords should be hashed');
    }
    
    console.log('\n💡 Login issue troubleshooting:');
    console.log(`1. Make sure the ${userType} login form is sending to the correct endpoint`);
    console.log('2. Check for CORS issues in browser console');
    console.log('3. Ensure passwords are being compared correctly (hashed vs. plain)');
    console.log('4. Verify JWT token generation is working properly');
    console.log('5. Check that localStorage is properly storing the token');
    
    // Log the relevant login API endpoint
    switch(userType) {
      case 'user':
        console.log('\n📌 API Endpoint: POST http://localhost:5000/api/auth/login');
        break;
      case 'doctor':
        console.log('\n📌 API Endpoint: POST http://localhost:5000/api/doctor/auth/login');
        break;
      case 'admin':
        console.log('\n📌 API Endpoint: POST http://localhost:5000/api/auth/admin/login');
        break;
    }
    
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

debugAuth(); 