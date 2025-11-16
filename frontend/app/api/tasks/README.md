# Tasks API Routes

This directory contains API routes for handling task data in the MindGuard application.

## Available Routes

### `/api/tasks/complete`

Handles completion of general tasks, specifically walking tasks.

**Method**: POST

**Request Body**:
```json
{
  "taskId": "string",
  "videoPath": "string",
  "walkingPercentage": "number"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Task completion updated successfully",
  "task": {
    "id": "string",
    "completed": true,
    "progress": 100,
    "videoPath": "string",
    "walkingPercentage": "number",
    "completedAt": "ISO date string"
  }
}
```

### `/api/tasks/complete-plank`

Handles completion of plank exercise tasks.

**Method**: POST

**Request Body**:
```json
{
  "taskId": "string",
  "videoPath": "string",
  "duration": "number"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Plank task completion updated successfully",
  "task": {
    "id": "string",
    "completed": true,
    "progress": 100,
    "videoPath": "string",
    "plankDuration": "number",
    "completedAt": "ISO date string"
  }
}
```

## File Storage

Uploaded video files are stored in the `exercise/standalone/video` directory. If a video path is provided that doesn't start with this directory, the API will automatically normalize the path to ensure it points to the correct location.

## Data Storage

Task data is stored in JSON format in the `/data/tasks.json` file. Logs are stored in the `/logs` directory.

## Error Handling

All API routes include proper error handling and will return appropriate HTTP status codes and error messages.

For example:

```json
{
  "error": "Task ID is required"
}
```

## Authentication

These routes currently do not implement authentication. In a production environment, authentication middleware should be added to protect these endpoints. 