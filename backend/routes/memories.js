const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Memory = require('../models/Memory');

// Get all memories for a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Ensure the requesting user matches the user ID in params or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to memories' });
    }
    
    const memories = await Memory.find({ userId })
      .sort({ date: -1 });
      
    res.json(memories);
  } catch (err) {
    console.error('Error fetching memories:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get a specific memory by date
router.get('/:userId/date/:date', auth, async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    // Ensure the requesting user matches the user ID in params or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to memories' });
    }
    
    const memory = await Memory.findOne({ userId, date });
    
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found for this date' });
    }
    
    res.json(memory);
  } catch (err) {
    console.error('Error fetching memory by date:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Create or update a memory
router.post('/', auth, async (req, res) => {
  try {
    const { date, content, userId } = req.body;
    
    // Validate required fields
    if (!date || !content) {
      return res.status(400).json({ error: 'Date and content are required' });
    }
    
    // If userId is provided, ensure it matches the authenticated user or user is admin
    const memoryUserId = userId || req.user.id;
    if (userId && req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to create/update for this user' });
    }
    
    // Create or update memory
    const memory = await Memory.findOneAndUpdate(
      { userId: memoryUserId, date },
      { content },
      { upsert: true, new: true }
    );
    
    // Log that the user engaged with the notes game
    try {
      const GameLog = require('../models/GameLog');
      const gameLog = new GameLog({
        userId: memoryUserId,
        gameType: 'notes',
        duration: 60, // Default duration in seconds
        notes: content.substring(0, 100) + (content.length > 100 ? '...' : ''), // Summary of content
        metadata: {
          date,
          wordCount: content.split(/\s+/).length
        }
      });
      await gameLog.save();
    } catch (logError) {
      console.error('Failed to log game activity:', logError);
      // Continue even if logging fails
    }
    
    res.status(201).json(memory);
  } catch (err) {
    console.error('Error creating/updating memory:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Delete a memory
router.delete('/:userId/date/:date', auth, async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    // Ensure the requesting user matches the user ID in params or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this memory' });
    }
    
    const result = await Memory.findOneAndDelete({ userId, date });
    
    if (!result) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.json({ message: 'Memory deleted successfully' });
  } catch (err) {
    console.error('Error deleting memory:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 