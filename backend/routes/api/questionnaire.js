const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Questionnaire = require('../../models/Questionnaire');
const HealthData = require('../../models/HealthData');

// @route   PUT api/questionnaire/update
// @desc    Update or create user's questionnaire data
// @access  Private
router.put('/update', auth, async (req, res) => {
  try {
    console.log('Received update request for user:', req.user.id);
    console.log('Update data:', req.body);

    const healthData = await HealthData.findOneAndUpdate(
      { user: req.user.id },
      { 
        $set: {
          questionnaireData: req.body,
          lastUpdated: Date.now()
        }
      },
      { new: true, upsert: true }
    );

    console.log('Updated health data:', healthData);
    res.json(healthData);
  } catch (err) {
    console.error('Error updating health data:', err);
    res.status(500).json({ error: 'Server error updating health data' });
  }
});

// @route   GET api/questionnaire/latest
// @desc    Get user's latest health data
// @access  Private
router.get('/latest', auth, async (req, res) => {
  try {
    // Find the user's health reports
    const healthData = await HealthData.findOne({ user: req.user.id });
    
    console.log('Found health data:', healthData); // Debug log
    
    if (!healthData) {
      return res.json({
        healthreports: {
          mood: 0,
          anxiety: 0,
          sleep: 0,
          energy: 0,
          concentration: 0,
          socialInteraction: 0,
          optimism: 0
        }
      });
    }

    // Return the data in the expected format
    res.json({
      healthreports: healthData.healthreports
    });
  } catch (err) {
    console.error('Error fetching health data:', err);
    res.status(500).send('Server Error');
  }
});

// Add this new route to insert/update health data
router.post('/submit', auth, async (req, res) => {
  try {
    const healthData = await HealthData.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          questionnaireData: req.body,
          lastUpdated: new Date()
        }
      },
      { 
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.json(healthData);
  } catch (err) {
    console.error('Error updating health data:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router; 