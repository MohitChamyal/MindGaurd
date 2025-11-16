const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI.replace(/\s+/g, '');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

// User Schema (without pre-save hook)
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  createdAt: Date,
  isPatient: Boolean,
  isDoctor: Boolean,
  isAdmin: Boolean
});

const User = mongoose.model('User', userSchema);

async function resetPassword(email, newPassword) {
  try {
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update directly without triggering pre-save hook
    await User.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    console.log(`✅ Password reset successfully for: ${email}`);
    console.log(`   New password: ${newPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node reset-user-password.js <email> <new-password>');
  console.log('Example: node reset-user-password.js test1@gmail.com MyNewPass123');
  process.exit(1);
}

resetPassword(email, password);
