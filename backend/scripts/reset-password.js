/**
 * Password Reset Script for MindGuard
 * 
 * This script allows administrators to reset passwords for users, doctors, or admins.
 * Usage: node scripts/reset-password.js [user|doctor|admin] email@example.com new-password
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
const newPassword = process.argv[4];

if (!userType || !email || !newPassword) {
  console.error('❌ Please provide all required parameters');
  console.error('Usage: node scripts/reset-password.js [user|doctor|admin] email@example.com new-password');
  process.exit(1);
}

if (!['user', 'doctor', 'admin'].includes(userType)) {
  console.error('❌ Invalid user type. Must be one of: user, doctor, admin');
  process.exit(1);
}

async function resetPassword() {
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
    
    let Model, account;
    
    switch(userType) {
      case 'user':
        Model = User;
        break;
      case 'doctor':
        Model = Doctor;
        break;
      case 'admin':
        Model = Admin;
        break;
    }
    
    account = await Model.findOne({ email });

    if (!account) {
      console.error(`❌ ${userType} not found in database`);
      console.log('💡 Check if:');
      console.log('   1. The email address is spelled correctly');
      console.log('   2. The account has been created');
      console.log('   3. You are using the correct user type');
      return;
    }

    console.log(`✅ ${userType} found in database`);
    
    // Generate salt and hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    console.log('🔄 Updating password...');
    
    // Different models might handle password updates differently
    if (userType === 'doctor' || userType === 'admin') {
      // Check if the model has a method for password updates
      account.password = hashedPassword;
      await account.save();
    } else {
      // For regular users or generic case
      await Model.findByIdAndUpdate(account._id, {
        password: hashedPassword
      });
    }
    
    console.log('✅ Password updated successfully');
    
    // Additional instructions
    console.log('\n📝 Next steps:');
    console.log('1. Inform the user of their new password');
    console.log('2. Advise them to change it upon their next login');
    
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

resetPassword(); 