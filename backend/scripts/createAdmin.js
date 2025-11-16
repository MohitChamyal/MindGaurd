require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function createDefaultAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@mindguard.com' });
    if (existingAdmin) {
      console.log('Default admin already exists');
      process.exit(0);
    }

    // Create default admin
    const admin = new Admin({
      email: 'admin@mindguard.com',
      password: 'admin@123',
      fullName: 'System Administrator',
      username: 'admin',
      role: 'super_admin'
    });

    await admin.save();
    console.log('Default admin created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating default admin:', err);
    process.exit(1);
  }
}

createDefaultAdmin(); 