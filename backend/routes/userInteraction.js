const express = require('express');
const router = express.Router();
const UserInteraction = require('../models/UserInteraction');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Get all interactions for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = 10, page = 1 } = req.query;

    const query = { userId };
    if (type) {
      query.interactionType = type;
    }

    const skip = (page - 1) * limit;

    const interactions = await UserInteraction.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const total = await UserInteraction.countDocuments(query);

    res.json({
      interactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific interaction by ID
router.get('/detail/:interactionId', async (req, res) => {
  try {
    const { interactionId } = req.params;
    
    const interaction = await UserInteraction.findById(interactionId);
    
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    
    res.json(interaction);
  } catch (error) {
    console.error('Error fetching interaction details:', error);
    res.status(500).json({ error: error.message });
  }
});

// View a specific report
router.get('/report/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find the user interaction that contains the report
    const interaction = await UserInteraction.findOne({
      _id: reportId,
      userId: userId,
      interactionType: 'report'
    });

    if (!interaction) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // If the interaction has a reportData field with a filePath
    if (interaction.reportData && interaction.reportData.filePath) {
      const filePath = interaction.reportData.filePath;
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Report file not found on server' });
      }
      
      // Set appropriate headers
      const filename = interaction.reportData.filename || 'report.pdf';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // If there's no file path, just return the interaction data
      res.json(interaction);
    }
  } catch (error) {
    console.error('Error viewing report:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Create a new interaction
router.post('/', async (req, res) => {
  try {
    const { 
      userId, 
      sessionId, 
      interactionType, 
      chatHistory, 
      questionnaireResponses, 
      reportData, 
      metadata 
    } = req.body;

    // Validate required fields
    if (!userId || !interactionType) {
      return res.status(400).json({ error: 'UserId and interactionType are required' });
    }

    const newInteraction = new UserInteraction({
      userId,
      sessionId: sessionId || uuidv4(),
      interactionType,
      chatHistory: chatHistory || [],
      questionnaireResponses: questionnaireResponses || [],
      reportData,
      startTime: new Date(),
      endTime: reportData ? new Date() : null,
      metadata: {
        ...metadata,
        timestamp: new Date()
      }
    });

    await newInteraction.save();

    res.status(201).json({
      success: true,
      interaction: newInteraction
    });
  } catch (error) {
    console.error('Error creating interaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an existing interaction
router.put('/:interactionId', async (req, res) => {
  try {
    const { interactionId } = req.params;
    const updates = req.body;
    
    // Don't allow updating userId or interactionType
    delete updates.userId;
    delete updates.interactionType;
    
    if (updates.endTime === true) {
      updates.endTime = new Date();
    }
    
    const updatedInteraction = await UserInteraction.findByIdAndUpdate(
      interactionId,
      { $set: updates },
      { new: true }
    );
    
    if (!updatedInteraction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    
    res.json({
      success: true,
      interaction: updatedInteraction
    });
  } catch (error) {
    console.error('Error updating interaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an interaction
router.delete('/:interactionId', async (req, res) => {
  try {
    const { interactionId } = req.params;
    
    const interaction = await UserInteraction.findById(interactionId);
    
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    
    // If there's a file associated with the interaction, delete it
    if (interaction.interactionType === 'report' && 
        interaction.reportData && 
        interaction.reportData.filePath) {
      try {
        if (fs.existsSync(interaction.reportData.filePath)) {
          fs.unlinkSync(interaction.reportData.filePath);
        }
      } catch (fileError) {
        console.error('Error deleting report file:', fileError);
        // Continue with deleting the interaction record even if file deletion fails
      }
    }
    
    await UserInteraction.findByIdAndDelete(interactionId);
    
    res.json({
      success: true,
      message: 'Interaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting interaction:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 