const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const HealthReport = require('../models/HealthReport');
const mongoose = require('mongoose');

// Get all health reports for a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Ensure the requesting user matches the user ID in params or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to health reports' });
    }
    
    const reports = await HealthReport.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100); // Limit to last 100 entries
      
    res.json(reports);
  } catch (err) {
    console.error('Error fetching health reports:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Create a new health report
router.post('/', auth, async (req, res) => {
  try {
    const {
      questionnaireData,
      voiceAssessment,
      emotionReport,
      progressData,
      userId // Allow passing userId for admin created reports
    } = req.body;
    
    // Create and save the health report
    const newReport = new HealthReport({
      userId: userId || req.user.id, // Use provided userId or default to auth user
      questionnaireData,
      voiceAssessment,
      emotionReport,
      progressData,
      timestamp: new Date()
    });
    
    await newReport.save();
    
    res.status(201).json(newReport);
  } catch (err) {
    console.error('Error creating health report:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ADMIN ENDPOINTS

// Admin: Get all health reports with user data
router.get('/admin/reports', adminAuth, async (req, res) => {
  try {
    console.log('Admin reports endpoint accessed by:', req.user.id, req.user.username);
    
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

    console.log('Querying reports since:', cutoffDate);

    // Get all reports within the timeframe
    const reports = await HealthReport.find({
      timestamp: { $gte: cutoffDate }
    })
    .sort({ timestamp: -1 })
    .lean();
    
    console.log(`Found ${reports.length} reports`);
    console.log('Sample report:', reports[0]);

    // Calculate statistics
    const uniqueUsers = await HealthReport.distinct('userId', {
      timestamp: { $gte: cutoffDate }
    });
    
    console.log(`Found ${uniqueUsers.length} unique users`);

    // Get emotion breakdown
    const emotionBreakdown = await HealthReport.aggregate([
      { $match: { timestamp: { $gte: cutoffDate } } },
      { $project: {
          emotions: { $objectToArray: '$emotionReport.summary.emotions_count' }
        }
      },
      { $unwind: '$emotions' },
      { $group: {
          _id: '$emotions.k',
          count: { $sum: '$emotions.v' },
          totalConfidence: { $sum: '$emotionReport.summary.average_confidence' }
        }
      },
      { $project: {
          _id: 0,
          type: '$_id',
          count: 1,
          confidence: { $divide: ['$totalConfidence', '$count'] }
        }
      }
    ]);
    
    console.log('Emotion breakdown:', emotionBreakdown);

    // Get daily activity metrics
    const dailyActivity = await HealthReport.aggregate([
      { $match: { timestamp: { $gte: cutoffDate } } },
      { $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          averageMood: { $avg: '$questionnaireData.mood' },
          averageAnxiety: { $avg: { 
            $cond: [
              { $eq: ['$questionnaireData.anxiety', 'high'] }, 3,
              { $cond: [{ $eq: ['$questionnaireData.anxiety', 'medium'] }, 2, 1] }
            ]
          }},
          totalReports: { $sum: 1 }
        }
      },
      { $project: {
          _id: 0,
          date: '$_id',
          mood: '$averageMood',
          anxiety: '$averageAnxiety',
          stress: { $multiply: ['$averageAnxiety', 0.8] },
          reportCount: '$totalReports'
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    console.log('Daily activity data:', dailyActivity);

    // Get crisis metrics
    const crisisMetrics = await HealthReport.aggregate([
      { $match: { timestamp: { $gte: cutoffDate } } },
      { $group: {
          _id: null,
          totalCrisisCount: { $sum: '$emotionReport.summary.crisis_count' },
          totalEmotionalValence: { $sum: '$emotionReport.summary.average_valence' },
          count: { $sum: 1 }
        }
      },
      { $project: {
          _id: 0,
          totalCrisisCount: 1,
          averageEmotionalValence: { $divide: ['$totalEmotionalValence', '$count'] }
        }
      }
    ]);
    
    console.log('Crisis metrics:', crisisMetrics[0]);

    // Combine all statistics
    const stats = {
      totalReports: reports.length,
      uniqueUsers: uniqueUsers.length,
      ...crisisMetrics[0],
      emotionBreakdown,
      dailyActivity
    };
    
    console.log('Final stats:', stats);

    res.json({
      reports,
      stats
    });
  } catch (err) {
    console.error('Error fetching health reports:', err);
    res.status(500).json({ error: 'Failed to fetch health reports' });
  }
});

module.exports = router; 