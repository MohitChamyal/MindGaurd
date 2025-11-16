/**
 * Password Rehash Script for MindGuard
 * 
 * This script finds all users with plaintext passwords and rehashes them.
 * Run this after fixing the authentication system to ensure all users
 * have properly hashed passwords.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function rehashPasswords() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find all users
    console.log('🔍 Fetching all users...');
    const users = await User.find({});
    console.log(`✅ Found ${users.length} users`);

    let rehashed = 0;
    let alreadyHashed = 0;
    let errors = 0;

    // Process each user
    for (const user of users) {
      const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
      
      if (!isHashed) {
        console.log(`🔄 Rehashing password for user: ${user.email}`);
        try {
          const plainPassword = user.password; // Store the plain password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(plainPassword, salt);
          
          // Update the user with hashed password
          await User.findByIdAndUpdate(user._id, { password: hashedPassword });
          console.log(`✅ Successfully rehashed password for ${user.email}`);
          rehashed++;
        } catch (error) {
          console.error(`❌ Error rehashing password for ${user.email}:`, error.message);
          errors++;
        }
      } else {
        console.log(`✓ Password for ${user.email} is already hashed`);
        alreadyHashed++;
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`Total users: ${users.length}`);
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

rehashPasswords(); 