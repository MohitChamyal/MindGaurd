/**
 * MongoDB Connection Test Script
 * 
 * Run this script to test the MongoDB connection and verify that collections 
 * are accessible and writable.
 * 
 * Usage: node test_mongodb_connection.js
 */

const mongoose = require('mongoose');
const HealthReport = require('./models/HealthReport');
const UserInteraction = require('./models/UserInteraction');
require('dotenv').config();

// MongoDB Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindguard';

// Test data
const testUserId = 'test-user-' + Date.now();
const timestamp = new Date();

async function testMongoDB() {
  console.log('=== MongoDB Connection Test ===');
  console.log(`Connecting to: ${MONGODB_URI.split('@').pop()}`); // Don't log credentials
  
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Successfully connected to MongoDB');
    
    // List all collections
    console.log('\nListing collections:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Test writing to HealthReport collection
    console.log('\nTesting HealthReport collection write...');
    const testReport = new HealthReport({
      userId: testUserId,
      reportType: 'test',
      questionnaireData: {
        mood: 7,
        anxiety: 'mild',
        sleep_quality: 6,
        energy_levels: 7,
        physical_symptoms: 'mild',
        concentration: 8,
        self_care: 'moderate',
        social_interactions: 6,
        intrusive_thoughts: 'none',
        optimism: 7,
        stress_factors: 'Test stress factors',
        coping_strategies: 'Test coping strategies',
        social_support: 7,
        self_harm: 'none',
        discuss_professional: 'Test professional discussion'
      },
      timestamp: timestamp
    });
    
    const savedReport = await testReport.save();
    console.log(`✓ Successfully saved test HealthReport with ID: ${savedReport._id}`);
    
    // Test writing to UserInteraction collection
    console.log('\nTesting UserInteraction collection write...');
    const testInteraction = new UserInteraction({
      userId: testUserId,
      sessionId: 'test-session-' + Date.now(),
      interactionType: 'test',
      questionnaireResponses: [{
        questionId: 'test-question',
        questionText: 'Test Question',
        response: 'Test Response',
        timestamp: timestamp
      }],
      startTime: timestamp,
      endTime: timestamp,
      metadata: {
        browser: 'Test Browser',
        platform: 'Test Platform',
        userAgent: 'Test UserAgent'
      }
    });
    
    const savedInteraction = await testInteraction.save();
    console.log(`✓ Successfully saved test UserInteraction with ID: ${savedInteraction._id}`);
    
    // Cleanup test data
    console.log('\nCleaning up test data...');
    await HealthReport.deleteOne({ _id: savedReport._id });
    await UserInteraction.deleteOne({ _id: savedInteraction._id });
    console.log('✓ Test data cleaned up');
    
    console.log('\n=== MongoDB Connection Test Successful ===');
    
  } catch (error) {
    console.error('\n⨯ MongoDB Connection Test Failed');
    console.error(`Error: ${error.message}`);
    if (error.name === 'MongoServerSelectionError') {
      console.error('\nPossible Issues:');
      console.error('1. MongoDB server is not running');
      console.error('2. Connection string is incorrect');
      console.error('3. Network issues preventing connection');
      console.error('4. Firewall blocking connections');
    } else if (error.name === 'ValidationError') {
      console.error('\nValidation Error:');
      Object.keys(error.errors).forEach(field => {
        console.error(`- ${field}: ${error.errors[field].message}`);
      });
    } else if (error.codeName) {
      console.error(`\nMongoDB Error Code: ${error.codeName}`);
    }
    
    console.error('\nConnection Details:');
    console.error(`- URL: ${MONGODB_URI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://******:******@')}`);
    console.error(`- Database: ${mongoose.connection.name || 'Not connected'}`);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the test
testMongoDB(); 