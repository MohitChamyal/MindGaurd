require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const userRoutes = require('./routes/user');
const healthTrackingRoutes = require('./routes/healthTracking');
const questionnaireRoutes = require('./routes/api/questionnaire');
const { router: voiceRoutes, setupWebSocket } = require('./routes/voice');
const doctorAuthRoutes = require('./routes/doctorAuth');
const adminAuthRoutes = require('./routes/adminAuth');
const adminDoctorsRoutes = require('./routes/adminDoctors');
const gameLogRoutes = require('./routes/gameLog');
const memoriesRoutes = require('./routes/memories');
const chatRoutes = require('./routes/chat');
const debugRoutes = require('./routes/debug');
const doctorsRoutes = require('./routes/doctors');
const { router: appointmentsRoutes } = require('./routes/appointments');
const patientDetailsRoutes = require('./routes/patientDetails');
const extraDetailsPatientsRoutes = require('./routes/extraDetailsPatients');
const consultationsRoutes = require('./routes/consultations');
const patientRegistrationsRoutes = require('./routes/patientRegistrations');
const { initializeWebSocket } = require('./services/websocketService');
const testApiRoutes = require('./routes/test-api');
const authRoutes = require('./routes/auth');
const userInteractionRoutes = require('./routes/userInteraction');
const exerciseRoutes = require('./routes/exercise');
const bcrypt = require('bcryptjs');

const app = express();

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'mindguard-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Middleware with specific CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow your frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/health-tracking', healthTrackingRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/voice', voiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/doctor', doctorAuthRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/game-logs', gameLogRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/health-reports', require('./routes/healthReport'));
app.use('/api/chat', chatRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/test', testApiRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/patient-details', patientDetailsRoutes);
app.use('/api/extra-details-patients', extraDetailsPatientsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/patient-registrations', patientRegistrationsRoutes);
app.use('/api/user-interactions', userInteractionRoutes);
app.use('/api/exercise', exerciseRoutes);

// Admin routes
app.use('/api/admin/doctors', adminDoctorsRoutes);

// Debug endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MongoDB Connection with robust error handling
const connectDB = async () => {
  try {
    // Fix any potential line breaks in the connection string
    const mongoURI = process.env.MONGODB_URI.replace(/\s+/g, '');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log('✅ MongoDB Connected');
    console.log('Database Name:', mongoose.connection.name);
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    console.error('Connection string format issue. Please check your .env file');
    
    // Retry with a modified connection string if needed
    try {
      // Fall back to local MongoDB if available
      console.log('Attempting to connect to local MongoDB...');
      await mongoose.connect('mongodb://localhost:27017/mindguard', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to local MongoDB');
    } catch (localErr) {
      console.error('Local MongoDB connection also failed:', localErr);
      console.error('Application will continue, but database functionality will be limited');
    }
  }
};

// Connect to MongoDB
connectDB();

// Add connection event listeners
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  // Attempt to reconnect after a delay
  setTimeout(() => {
    console.log('Attempting to reconnect to MongoDB...');
    connectDB();
  }, 5000);
});

// Import User model
const User = require('./models/User');

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('Signup request received:', req.body);
    const { username, email, password, isPatientAccount, createdByDoctor } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide all required fields'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: 'User already exists'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      // Add additional fields if this is a doctor-created patient account
      isPatient: isPatientAccount === true,
      createdByDoctor: createdByDoctor === true
    });

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      msg: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        isPatient: newUser.isPatient,
        createdByDoctor: newUser.createdByDoctor
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error during signup',
      error: error.message
    });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid credentials'
      });
    }

    // Check if password is already in bcrypt format
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    
    // If not hashed (legacy case), compare directly
    let isMatch = false;
    
    if (isHashed) {
      // Verify password using bcrypt
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy case - direct comparison (not secure!)
      isMatch = (password === user.password);
      
      // If match, upgrade to hashed password for future
      if (isMatch) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        console.log(`Upgraded password hash for user: ${user.email}`);
      }
    }
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      msg: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error during login',
      error: error.message
    });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ msg: 'API is working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    msg: 'Something went wrong!',
    error: err.message
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    msg: 'Route not found'
  });
});

const PORT = process.env.PORT || 3001;
console.log('PORT from env:', process.env.PORT, '| Using PORT:', PORT);
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Setup WebSocket server
setupWebSocket(server); 

// Initialize chat WebSocket service
initializeWebSocket(server);

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Server shutting down');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
}); 