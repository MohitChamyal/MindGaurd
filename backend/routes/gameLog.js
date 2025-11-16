const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const GameLog = require('../models/GameLog');
const mongoose = require('mongoose');

// Get all game logs for a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Ensure the requesting user matches the user ID in params or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to game logs' });
    }
    
    const logs = await GameLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100); // Limit to last 100 entries
      
    res.json(logs);
  } catch (err) {
    console.error('Error fetching game logs:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get game logs for a specific game type
router.get('/:userId/type/:gameType', auth, async (req, res) => {
  try {
    const { userId, gameType } = req.params;
    
    // Ensure the requesting user matches the user ID in params or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to game logs' });
    }
    
    const logs = await GameLog.find({ userId, gameType })
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(logs);
  } catch (err) {
    console.error('Error fetching game logs by type:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Create a new game log
router.post('/', auth, async (req, res) => {
  try {
    const { 
      gameType, 
      duration, 
      completionStatus, 
      score, 
      notes, 
      metadata,
      userId // Allow passing userId for admin created logs
    } = req.body;
    
    // Create and save the game log
    const newLog = new GameLog({
      userId: userId || req.user.id, // Use provided userId or default to auth user
      gameType,
      duration,
      completionStatus,
      score,
      notes,
      metadata
    });
    
    await newLog.save();
    
    res.status(201).json(newLog);
  } catch (err) {
    console.error('Error creating game log:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get game statistics for a user
router.get('/:userId/stats', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Ensure the requesting user matches the user ID in params or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to game stats' });
    }
    
    // Get total time spent on each game type
    const gameTimes = await GameLog.aggregate([
      { $match: { userId } },
      { $group: {
          _id: '$gameType',
          totalTime: { $sum: '$duration' },
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);
    
    // Get highest scores
    const highestScores = await GameLog.aggregate([
      { $match: { userId } },
      { $group: {
          _id: '$gameType',
          highestScore: { $max: '$score' }
        }
      }
    ]);
    
    // Get session count by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyActivity = await GameLog.aggregate([
      { 
        $match: { 
          userId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      gameTimes,
      highestScores,
      dailyActivity
    });
  } catch (err) {
    console.error('Error fetching game statistics:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ADMIN ENDPOINTS

// Admin: Get all game logs with user data
router.get('/admin/logs', adminAuth, async (req, res) => {
  try {
    console.log('Admin logs endpoint accessed by:', req.user.id, req.user.username);
    
    // Parse timeframe parameter
    const timeframe = req.query.timeframe || '4w'; // Default to 4 weeks
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case '1w':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case '2w':
        cutoffDate.setDate(cutoffDate.getDate() - 14);
        break;
      case '4w':
        cutoffDate.setDate(cutoffDate.getDate() - 28);
        break;
      case '3m':
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
      default:
        cutoffDate.setDate(cutoffDate.getDate() - 28); // Default to 4 weeks
    }

    // Check if collection exists and get direct access to MongoDB collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name.toLowerCase());
    
    console.log('Admin logs: Available collections:', collectionNames);
    
    // Find the correct gameLog collection name
    const gameLogCollection = collectionNames.find(col => 
      col === 'gamelogs' || col === 'game_logs' || col === 'gamelog'
    );
    
    if (!gameLogCollection) {
      console.log('Admin logs: GameLog collection not found');
      return res.status(404).json({ error: 'GameLog collection not found' });
    }
    
    console.log(`Admin logs: Using collection "${gameLogCollection}"`);
    
    // Get direct access to the collection
    const collection = mongoose.connection.db.collection(gameLogCollection);
    
    // Get a sample document to inspect schema
    const sampleDoc = await collection.findOne({});
    console.log('Admin logs: Sample document structure:', JSON.stringify(sampleDoc, null, 2));

    // Use MongoDB's $lookup to join with the users collection to get usernames if possible
    let logs;
    try {
      // Try the aggregate with lookup first
      logs = await collection.aggregate([
        { 
          $match: { 
            createdAt: { $gte: cutoffDate }
          }
        },
        {
          // Try to lookup in the users collection
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            gameType: 1,
            duration: 1,
            completionStatus: 1,
            score: 1,
            notes: 1,
            metadata: 1,
            createdAt: 1,
            username: { $arrayElemAt: [{ $map: { input: "$userInfo", as: "user", in: { $ifNull: ["$$user.fullname", "$$user.email"] } } }, 0] }
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 100 }
      ]).toArray();
    } catch (err) {
      console.warn('Admin logs: Aggregate with lookup failed, trying simpler query:', err.message);
      
      // If the aggregate fails, fall back to a simple find
      logs = await collection.find({
        createdAt: { $gte: cutoffDate }
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    }

    // If lookup didn't work for some user IDs, try to get readable names
    const logsWithUsernames = logs.map(log => {
      if (!log.username) {
        log.username = `User ${log.userId ? log.userId.toString().substring(0, 5) : "Unknown"}`;
      }
      return log;
    });

    console.log('Admin logs: Successfully compiled response with', logsWithUsernames.length, 'logs');
    res.json(logsWithUsernames);
  } catch (err) {
    console.error('Error fetching admin game logs:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Admin: Get game statistics across all users
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    console.log('Admin stats endpoint accessed by:', req.user.id, req.user.username);
    
    // Parse timeframe parameter
    const timeframe = req.query.timeframe || '4w'; // Default to 4 weeks
    const cutoffDate = new Date();
    
    console.log('Admin stats: Using timeframe', timeframe);
    
    switch (timeframe) {
      case '1w':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case '2w':
        cutoffDate.setDate(cutoffDate.getDate() - 14);
        break;
      case '4w':
        cutoffDate.setDate(cutoffDate.getDate() - 28);
        break;
      case '3m':
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
      default:
        cutoffDate.setDate(cutoffDate.getDate() - 28); // Default to 4 weeks
    }

    // Check if collection exists and get direct access to MongoDB collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name.toLowerCase());
    
    console.log('Admin stats: Available collections:', collectionNames);
    
    // Find the correct gameLog collection name - it might be gamelogs, game_logs, gamelog, etc.
    const gameLogCollection = collectionNames.find(col => 
      col === 'gamelogs' || col === 'game_logs' || col === 'gamelog'
    );
    
    if (!gameLogCollection) {
      console.log('Admin stats: GameLog collection not found');
      return res.status(404).json({ error: 'GameLog collection not found' });
    }
    
    console.log(`Admin stats: Using collection "${gameLogCollection}"`);
    
    // Get direct access to the collection
    const collection = mongoose.connection.db.collection(gameLogCollection);
    
    // Get a sample document to inspect schema
    const sampleDoc = await collection.findOne({});
    console.log('Admin stats: Sample document structure:', JSON.stringify(sampleDoc, null, 2));
    
    // Get total number of games played
    const totalGames = await collection.countDocuments({
      createdAt: { $gte: cutoffDate }
    });
    console.log('Admin stats: Total games count:', totalGames);

    // Get count of unique users who played games
    const uniqueUsers = await collection.aggregate([
      { $match: { createdAt: { $gte: cutoffDate } } },
      { $group: { _id: '$userId' } },
      { $count: 'count' }
    ]).toArray();
    console.log('Admin stats: Unique users query completed');

    // Get breakdown by game type with duration
    const gameTypeBreakdown = await collection.aggregate([
      { $match: { createdAt: { $gte: cutoffDate } } },
      { $group: {
          _id: '$gameType',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $project: {
          _id: 0,
          type: '$_id',
          count: 1,
          totalDuration: 1
        }
      }
    ]).toArray();
    console.log('Admin stats: Game type breakdown query completed');

    // Get total duration across all games
    const totalDuration = gameTypeBreakdown.length > 0 
      ? gameTypeBreakdown.reduce((sum, game) => sum + game.totalDuration, 0)
      : 0;

    // Get daily activity broken down by game type
    const dailyActivity = await collection.aggregate([
      { $match: { createdAt: { $gte: cutoffDate } } },
      { $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            gameType: '$gameType'
          },
          count: { $sum: 1 }
        }
      },
      { $group: {
          _id: '$_id.date',
          gameTypes: {
            $push: {
              type: '$_id.gameType',
              count: '$count'
            }
          }
        }
      },
      { $project: {
          _id: 0,
          date: '$_id',
          notes: { $sum: { $map: { input: { $filter: { input: '$gameTypes', as: 'game', cond: { $eq: ['$$game.type', 'notes'] } } }, as: 'g', in: '$$g.count' } } },
          puzzle: { $sum: { $map: { input: { $filter: { input: '$gameTypes', as: 'game', cond: { $eq: ['$$game.type', 'puzzle'] } } }, as: 'g', in: '$$g.count' } } },
          breathing: { $sum: { $map: { input: { $filter: { input: '$gameTypes', as: 'game', cond: { $eq: ['$$game.type', 'breathing'] } } }, as: 'g', in: '$$g.count' } } },
          other: { $sum: { $map: { input: { $filter: { input: '$gameTypes', as: 'game', cond: { $eq: ['$$game.type', 'other'] } } }, as: 'g', in: '$$g.count' } } }
        }
      },
      { $sort: { date: 1 } }
    ]).toArray();
    console.log('Admin stats: Daily activity query completed');

    const result = {
      totalGames,
      uniqueUsers: uniqueUsers.length > 0 ? uniqueUsers[0].count : 0,
      totalDuration,
      gameTypeBreakdown,
      dailyActivity
    };
    
    console.log('Admin stats: Successfully compiled response');
    res.json(result);
  } catch (err) {
    console.error('Error fetching admin game statistics:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;