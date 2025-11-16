/**
 * MindGuard Backend Startup Verification Script
 * 
 * This script runs checks to ensure the backend is properly configured
 * before starting the server.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('🔍 Running MindGuard backend verification...');

// Check for required environment variables
const requiredEnvVars = [
  { name: 'MONGODB_URI', msg: 'MongoDB connection string' },
  { name: 'JWT_SECRET', msg: 'JWT secret key' }
];

let envErrors = 0;
requiredEnvVars.forEach(({ name, msg }) => {
  if (!process.env[name]) {
    console.error(`❌ Missing ${msg} in environment variables (${name})`);
    envErrors++;
  } else {
    console.log(`✅ Found ${msg}`);
  }
});

// Check MongoDB connection
async function checkMongoDB() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    
    // Fix any potential line breaks in the connection string
    const mongoURI = process.env.MONGODB_URI.replace(/\s+/g, '');
    
    // Try to connect with a short timeout
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Short timeout for quick feedback
    });
    
    console.log('✅ MongoDB connection successful');
    console.log(`   Database: ${mongoose.connection.name}`);
    
    // Close connection after test
    await mongoose.connection.close();
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:');
    console.error(`   ${err.message}`);
    return false;
  }
}

// Check folder permissions
function checkFolderPermissions() {
  const foldersToCheck = [
    { path: path.join(__dirname, 'uploads'), create: true },
    { path: path.join(__dirname, 'temp'), create: true }
  ];
  
  foldersToCheck.forEach(folder => {
    try {
      // Create folder if it doesn't exist and create flag is true
      if (!fs.existsSync(folder.path) && folder.create) {
        fs.mkdirSync(folder.path, { recursive: true });
        console.log(`✅ Created folder: ${folder.path}`);
      }
      
      // Check read/write permissions by writing test file
      const testFile = path.join(folder.path, '.test_permission');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`✅ Folder has read/write permissions: ${folder.path}`);
    } catch (err) {
      console.error(`❌ Permission issue with folder: ${folder.path}`);
      console.error(`   ${err.message}`);
    }
  });
}

// Check JWT functionality
function checkJWT() {
  try {
    const testPayload = { test: 'data' };
    const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.test === testPayload.test) {
      console.log('✅ JWT signing and verification working properly');
      return true;
    } else {
      console.error('❌ JWT verification failed');
      return false;
    }
  } catch (err) {
    console.error('❌ JWT test failed:');
    console.error(`   ${err.message}`);
    return false;
  }
}

// Check bcrypt functionality
async function checkBcrypt() {
  try {
    const testPassword = 'test_password';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    
    if (isMatch) {
      console.log('✅ bcrypt password hashing working properly');
      return true;
    } else {
      console.error('❌ bcrypt verification failed');
      return false;
    }
  } catch (err) {
    console.error('❌ bcrypt test failed:');
    console.error(`   ${err.message}`);
    return false;
  }
}

// Run all checks
async function runChecks() {
  console.log('\n🔍 ENVIRONMENT VARIABLES CHECK');
  if (envErrors > 0) {
    console.error(`❌ Found ${envErrors} environment variable issues`);
  } else {
    console.log('✅ All required environment variables found');
  }
  
  console.log('\n🔍 MONGODB CONNECTION CHECK');
  const mongoDBSuccess = await checkMongoDB();
  
  console.log('\n🔍 FOLDER PERMISSIONS CHECK');
  checkFolderPermissions();
  
  console.log('\n🔍 JWT FUNCTIONALITY CHECK');
  const jwtSuccess = checkJWT();
  
  console.log('\n🔍 BCRYPT FUNCTIONALITY CHECK');
  const bcryptSuccess = await checkBcrypt();
  
  // Summary
  console.log('\n📋 VERIFICATION SUMMARY');
  const allChecksPass = envErrors === 0 && mongoDBSuccess && jwtSuccess && bcryptSuccess;
  
  if (allChecksPass) {
    console.log('✅ All checks passed! Backend is properly configured.');
    console.log('🚀 You can now start the server with: npm start');
    return true;
  } else {
    console.error('❌ Some checks failed. Please fix the issues above before starting the server.');
    return false;
  }
}

// Export for use in other scripts
module.exports = { runChecks };

// Run checks if called directly
if (require.main === module) {
  runChecks().then(success => {
    // Exit with appropriate code (0 = success, 1 = failure)
    process.exit(success ? 0 : 1);
  });
} 