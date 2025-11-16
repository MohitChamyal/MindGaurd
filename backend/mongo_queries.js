// MongoDB queries to check data

// Query to check if PDF reports were saved in HealthReport collection
db.healthreports.find({ userId: 'c104e494-5b78-437a-8c77-b5afce452c0b', reportType: 'pdf-upload' })

// Query to check if PDF reports were saved in UserInteraction collection
db.userinteractions.find({ userId: 'c104e494-5b78-437a-8c77-b5afce452c0b', interactionType: 'report' })

// Count all interactions for this user
db.userinteractions.countDocuments({ userId: 'c104e494-5b78-437a-8c77-b5afce452c0b' })

// Find the most recent 5 interactions for this user
db.userinteractions.find({ userId: 'c104e494-5b78-437a-8c77-b5afce452c0b' }).sort({ startTime: -1 }).limit(5)

// Check all health reports for a specific user
db.healthreports.find({ userId: 'c104e494-5b78-437a-8c77-b5afce452c0b' })

// To run these queries:
// 1. Connect to your MongoDB instance
// 2. Use the MindGuard database: use mindguard
// 3. Copy and paste the queries above one at a time 