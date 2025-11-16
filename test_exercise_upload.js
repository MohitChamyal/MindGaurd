const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const API_URL = 'http://localhost:5000/api/exercise/upload'; // Backend endpoint
const VIDEO_PATH = path.join(__dirname, 'agent', 'exercise', 'squat1.mp4');
const EXERCISE_TYPE = 'squats'; // Options: squats, bicepcurls, plank, pushup

async function testExerciseUpload() {
  try {
    // Check if video file exists
    if (!fs.existsSync(VIDEO_PATH)) {
      console.error(`Video file not found: ${VIDEO_PATH}`);
      return;
    }
    
    console.log(`Uploading video: ${VIDEO_PATH}`);
    console.log(`Exercise type: ${EXERCISE_TYPE}`);
    
    // Create form data
    const formData = new FormData();
    formData.append('video', fs.createReadStream(VIDEO_PATH));
    formData.append('exerciseType', EXERCISE_TYPE);
    
    // Upload the video
    console.log('Sending request to backend...');
    const startTime = Date.now();
    const response = await axios.post(API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    const endTime = Date.now();
    console.log(`Request completed in ${(endTime - startTime)/1000} seconds`);
    
    // Display the response
    console.log('Response from server:', JSON.stringify(response.data, null, 2));
    
    // If successful, display the exercise metrics
    if (response.data.success) {
      console.log('\nExercise Analysis Results:');
      console.log(`Duration: ${response.data.duration} seconds`);
      console.log(`Treasure earned: ${response.data.treasureEarned ? 'Yes' : 'No'}`);
      console.log(`Saved filename: ${response.data.filename}`);
    }
  } catch (error) {
    console.error('Error uploading exercise video:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testExerciseUpload(); 