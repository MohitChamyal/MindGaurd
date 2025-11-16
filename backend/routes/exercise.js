const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const multer = require('multer');

// Configure multer for exercise video uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const exerciseType = req.body.exerciseType || 'unknown';
    const uploadDir = path.join(__dirname, `../uploads/exercises/${exerciseType}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `exercise-${uniqueSuffix}${ext}`;
    
    // Store the filename in the request for later use
    req.videoFilename = filename;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only video files
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  },
  fileFilter: fileFilter
});

// Helper function to run Python exercise analysis
const analyzeExercise = (exerciseType, videoPath) => {
  return new Promise((resolve, reject) => {
    // Normalize exercise type to handle variations in casing or formatting
    const normalizedExerciseType = exerciseType.toLowerCase().trim();
    
    // Map exercise type to Python script
    let scriptName;
    switch (normalizedExerciseType) {
      case 'plank':
        scriptName = 'Plank_Standalone.py';
        break;
      case 'pushup':
      case 'push-up':
      case 'push up':
        scriptName = 'Pushup_Standalone.py';
        break;
      case 'squats':
      case 'squat':
        scriptName = 'Squats_Standalone.py';
        break;
      case 'bicepcurls':
      case 'bicep curl':
      case 'bicep curls':
      case 'bicep-curl':
        scriptName = 'BicepCurls_Standalone.py';
        break;
      case 'walking':
      case 'walk':
        // For walking, use a walking-specific script or fallback to a default
        scriptName = 'Plank_Standalone.py'; // Replace with Walking_Standalone.py when available
        break;
      default:
        return reject(new Error(`Unsupported exercise type: ${exerciseType}`));
    }

    const pythonScriptPath = path.join(__dirname, `../../agent/exercise/standalone/${scriptName}`);
    console.log(`Running Python script: ${pythonScriptPath}`);
    console.log(`Video path: ${videoPath}`);

    // Check if the Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
      return reject(new Error(`Python script not found: ${scriptName}`));
    }

    // Use python3 command if available, fallback to python
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    // Build command arguments based on script support
    let args = [pythonScriptPath, '--video', videoPath];
    
    // Add show flag for scripts we know support it
    // This ensures compatibility with older scripts that might not have the flag yet
    const scriptsWithShowFlag = ['Plank_Standalone.py', 'Pushup_Standalone.py', 'BicepCurls_Standalone.py'];
    if (scriptsWithShowFlag.includes(scriptName)) {
      args.push('--show');
    }
    
    console.log(`Running Python command: ${pythonCommand} ${args.join(' ')}`);
    const pythonProcess = spawn(pythonCommand, args);
    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      console.log('Python stdout chunk:', chunk);
      result += chunk;
    });

    pythonProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      console.log('Python stderr chunk:', chunk);
      error += chunk;
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code: ${code}`);
      
      if (code !== 0) {
        reject(new Error(`Exercise analysis failed with code ${code}: ${error}`));
      } else {
        // Parse duration from output
        try {
          // Look for total duration pattern in the output
          let duration = 0;
          
          // For counting exercises (pushups, squats, bicep curls)
          if (['pushup', 'squats', 'bicepcurls'].includes(normalizedExerciseType)) {
            // Try to extract count by looking for multiple patterns
            let count = 0;
            
            // Look for total count summaries (end of output)
            const totalCountMatch = result.match(/Total ([a-z\s]+) count: ([0-9.]+)/i);
            if (totalCountMatch && totalCountMatch[2]) {
              count = parseFloat(totalCountMatch[2]);
              console.log(`Found total count summary: ${count}`);
            }
            
            // If no total count found, look for incremental counts (last one is total)
            if (count === 0) {
              const allCounts = result.matchAll(/Complete [a-z\s]+ detected. Total count: ([0-9.]+)/gi);
              let lastCount = 0;
              // Convert iterator to array to get the last match
              const countsArray = Array.from(allCounts);
              if (countsArray.length > 0) {
                const lastMatch = countsArray[countsArray.length - 1];
                lastCount = parseFloat(lastMatch[1]);
                console.log(`Found last incremental count: ${lastCount}`);
              }
              count = lastCount;
            }
            
            // If still no count, try the original simple pattern as fallback
            if (count === 0) {
              const simpleMatch = result.match(/Total count: ([0-9.]+)/i);
              if (simpleMatch && simpleMatch[1]) {
                count = parseFloat(simpleMatch[1]);
                console.log(`Found simple count: ${count}`);
              }
            }
            
            duration = count;
            console.log(`Final count for ${normalizedExerciseType}: ${duration}`);
          } else {
            // For duration-based exercises (plank, walking)
            const durationMatch = result.match(/Total [a-z]+ duration: ([0-9.]+) seconds/i);
            duration = durationMatch ? parseFloat(durationMatch[1]) : 0;
          }
          
          // Check if they earned a treasure - award treasure for any exercise with at least 2 reps
          const treasureEarned = result.includes('Treasure awarded!') || 
                               result.includes('Congratulations! You\'ve earned a treasure!') ||
                               (
                                 // For counting exercises, count >= 2 is success (reduced threshold)
                                 ['pushup', 'squats', 'bicepcurls'].includes(normalizedExerciseType) && 
                                 duration >= 2
                               ) ||
                               (
                                 // For duration-based exercises, 5+ seconds is success
                                 ['plank', 'walking'].includes(normalizedExerciseType) && 
                                 duration >= 5
                               );
          
          // Log treasure award decision
          console.log(`Exercise ${normalizedExerciseType} completed with ${['pushup', 'squats', 'bicepcurls'].includes(normalizedExerciseType) ? 'count' : 'duration'}: ${duration}`);
          console.log(`Treasure awarded: ${treasureEarned}`);
          
          resolve({
            duration,
            treasureEarned,
            output: result
          });
        } catch (e) {
          console.error('Parse error:', e);
          reject(new Error(`Failed to parse exercise results: ${e.message}`));
        }
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      reject(new Error(`Failed to start exercise analysis: ${err.message}`));
    });
  });
};

// GET route to check if Python environment is properly configured
router.get('/healthcheck', async (req, res) => {
  try {
    // Use python3 command if available, fallback to python
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    // Check if Python is available and get version
    const checkPython = spawn(pythonCommand, ['--version']);
    let pythonVersion = '';
    let pythonError = '';

    checkPython.stdout.on('data', (data) => {
      pythonVersion += data.toString();
    });

    checkPython.stderr.on('data', (data) => {
      pythonError += data.toString();
    });

    await new Promise((resolve) => {
      checkPython.on('close', (code) => {
        resolve();
      });
    });

    // Check for required modules
    const checkModules = spawn(pythonCommand, ['-c', 'import mediapipe, numpy, cv2; print("All modules successfully imported")']);
    let moduleOutput = '';
    let moduleError = '';

    checkModules.stdout.on('data', (data) => {
      moduleOutput += data.toString();
    });

    checkModules.stderr.on('data', (data) => {
      moduleError += data.toString();
    });

    await new Promise((resolve) => {
      checkModules.on('close', (code) => {
        resolve();
      });
    });

    // Check if exercise scripts exist
    const plankScriptPath = path.join(__dirname, '../../agent/exercise/standalone/Plank_Standalone.py');
    const plankScriptExists = fs.existsSync(plankScriptPath);

    res.json({
      success: true,
      pythonAvailable: pythonVersion ? true : false,
      pythonVersion: pythonVersion.trim() || 'Not available',
      pythonError: pythonError.trim(),
      modulesAvailable: moduleOutput.includes('All modules successfully imported'),
      moduleError: moduleError.trim(),
      scriptsAvailable: {
        plank: plankScriptExists
      },
      uploadDir: path.join(__dirname, '../uploads/exercises'),
      platform: process.platform
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to run health check',
      error: error.toString()
    });
  }
});

// Common handler for exercise video processing
const handleExerciseUpload = (exerciseType) => async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file uploaded' });
    }

    // Get the full path to the uploaded video
    const videoPath = req.file.path;
    console.log(`Video uploaded to: ${videoPath}`);
    console.log(`Exercise type: ${exerciseType}`);

    try {
      // Normalize exercise type to handle variations
      const normalizedExerciseType = exerciseType.toLowerCase().trim();
      
      // Analyze the exercise
      const result = await analyzeExercise(normalizedExerciseType, videoPath);
      
      // Calculate wellness scores based on exercise type
      let wellnessScore = 0;
      let wellnessMessage = '';
      
      switch (normalizedExerciseType) {
        case 'plank':
          // Plank wellness score based on duration held
          wellnessScore = Math.min(100, result.duration * 10); // 10 points per second up to 100
          wellnessMessage = `You held the plank for ${result.duration.toFixed(1)} seconds`;
          break;
          
        case 'pushup': 
        case 'push-up':
        case 'push up':
          // For pushups, we get "duration" but it's actually a count
          wellnessScore = Math.min(100, result.duration * 20); // 20 points per pushup up to 100
          wellnessMessage = `You completed ${result.duration} pushups`;
          break;
          
        case 'squats':
        case 'squat':
          // For squats, we get "duration" but it's actually a count  
          wellnessScore = Math.min(100, result.duration * 15); // 15 points per squat up to 100
          wellnessMessage = `You completed ${result.duration} squats`;
          break;
          
        case 'bicepcurls':
        case 'bicep curl':
        case 'bicep curls':
        case 'bicep-curl':
          // For bicep curls, we get "duration" but it's actually a count
          wellnessScore = Math.min(100, result.duration * 12); // 12 points per curl up to 100
          wellnessMessage = `You completed ${result.duration} bicep curls`;
          break;
          
        case 'walking':
        case 'walk':
          // For walking, use duration (in seconds) as a base
          wellnessScore = Math.min(100, result.duration / 5); // 1 point per 5 seconds up to 100
          wellnessMessage = `You walked for ${result.duration.toFixed(1)} seconds`;
          break;
          
        default:
          wellnessScore = result.duration > 0 ? 50 : 0; // Default some points if any activity
          wellnessMessage = 'Exercise recorded';
      }
      
      // Return the analysis results with wellness score
      res.status(200).json({
        success: true,
        message: 'Exercise analysis completed successfully',
        duration: result.duration,
        treasureEarned: result.treasureEarned,
        filename: req.file.filename,
        wellnessScore: Math.round(wellnessScore),
        wellnessMessage
      });
    } catch (analysisError) {
      console.error('Exercise analysis error:', analysisError);
      
      // Return a more user-friendly error
      res.status(500).json({
        success: false,
        message: `Analysis failed: ${analysisError.message}`,
        details: "This may be due to Python environment issues or problems with the video format."
      });
    }
  } catch (error) {
    console.error('Error in exercise upload:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze exercise video'
    });
  }
};

// Configure multer upload middleware
const configureUpload = (exerciseType) => {
  return (req, res, next) => {
    // Store the exercise type in the request object for use in the storage config
    req.body.exerciseType = exerciseType;
    
    const exerciseUpload = multer({
      storage: multer.diskStorage({
        destination: function(req, file, cb) {
          // Create directory for specific exercise type
          const uploadDir = path.join(__dirname, `../uploads/exercises/${exerciseType}`);
          console.log(`Creating upload directory for exercise type: ${exerciseType}`);
          
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          cb(null, uploadDir);
        },
        filename: function(req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(file.originalname);
          const filename = `exercise-${uniqueSuffix}${ext}`;
          
          req.videoFilename = filename;
          cb(null, filename);
        }
      }),
      limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max file size
      },
      fileFilter: fileFilter
    }).single('video');

    exerciseUpload(req, res, function(err) {
      if (err) {
        return res.status(400).json({ 
          success: false, 
          message: err.message || 'Error uploading file' 
        });
      }
      
      next();
    });
  };
};

// Generic upload endpoint (fallback/legacy)
router.post('/upload', 
  (req, res, next) => {
    // Extract exercise type from query params or body
    const exerciseType = req.query.exerciseType || req.body.exerciseType || 'unknown';
    req.body.exerciseType = exerciseType;
    
    configureUpload(exerciseType)(req, res, next);
  },
  async (req, res) => {
    const exerciseType = req.body.exerciseType || req.query.exerciseType || 'unknown';
    return handleExerciseUpload(exerciseType)(req, res);
  }
);

// Dedicated endpoints for specific exercise types
router.post('/plank', configureUpload('plank'), handleExerciseUpload('plank'));
router.post('/pushup', configureUpload('pushup'), handleExerciseUpload('pushup'));
router.post('/squats', configureUpload('squats'), handleExerciseUpload('squats'));
router.post('/bicepcurls', configureUpload('bicepcurls'), handleExerciseUpload('bicepcurls'));
router.post('/walking', configureUpload('walking'), handleExerciseUpload('walking'));

module.exports = router; 