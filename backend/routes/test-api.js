const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Connect directly to the collections
const User = mongoose.model('User');

// Use mongoose.connection.collection to directly access the collection without creating a model
// This avoids the "Cannot overwrite `Doctor` model once compiled" error
const doctorsCollection = mongoose.connection.collection('doctors');

// GET /api/test/users endpoint - real data from MongoDB
router.get('/users', async (req, res) => {
  try {
    // Fetch real users from database
    const users = await User.find({}).lean();
    console.log(`Found ${users.length} users in the database`);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users from database' });
  }
});

// GET /api/test/doctors endpoint - real data from MongoDB
router.get('/doctors', async (req, res) => {
  try {
    // Fetch real doctors from database using the direct collection reference
    const doctors = await doctorsCollection.find({}).toArray();
    console.log(`Found ${doctors.length} doctors in the database`);
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors from database' });
  }
});

// GET single user by ID - real data
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ error: 'Failed to fetch user from database' });
  }
});

// GET single doctor by ID - real data
router.get('/doctors/:id', async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    // Use MongoDB ObjectId for querying by ID
    const { ObjectId } = mongoose.Types;
    let objectId;
    
    try {
      objectId = new ObjectId(doctorId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid doctor ID format' });
    }
    
    // Find doctor using direct collection access
    const doctor = await doctorsCollection.findOne({ _id: objectId });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
    console.error('Error fetching doctor by ID:', error);
    res.status(500).json({ error: 'Failed to fetch doctor from database' });
  }
});

module.exports = router; 