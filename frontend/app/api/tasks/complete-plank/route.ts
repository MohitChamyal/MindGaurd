import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { promises as fs } from 'fs';
import path from 'path';

// Database simulation - in a real app, this would be a database call
const updatePlankTaskInDatabase = async (taskId: string, videoPath: string, duration: number) => {
  // Get data file path (in a real app, this would be a database)
  const dataFilePath = path.join(process.cwd(), 'data', 'tasks.json');
  
  // Ensure videoPath points to the video folder
  const normalizedVideoPath = videoPath.startsWith('exercise/standalone/video') 
    ? videoPath 
    : path.join('exercise/standalone/video', path.basename(videoPath));
  
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    
    // Read existing data or initialize with empty array
    let tasks = [];
    try {
      const data = await fs.readFile(dataFilePath, 'utf8');
      tasks = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, initialize with empty array
      tasks = [];
    }
    
    // Find and update task
    const taskIndex = tasks.findIndex((task: any) => task.id === taskId);
    if (taskIndex >= 0) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        completed: true,
        progress: 100,
        videoPath: normalizedVideoPath,
        plankDuration: duration,
        completedAt: new Date().toISOString()
      };
    } else {
      // Task not found, add new entry
      tasks.push({
        id: taskId,
        completed: true,
        progress: 100,
        videoPath: normalizedVideoPath,
        plankDuration: duration,
        completedAt: new Date().toISOString()
      });
    }
    
    // Save updated data
    await fs.writeFile(dataFilePath, JSON.stringify(tasks, null, 2));
    
    return tasks[taskIndex] || tasks[tasks.length - 1];
  } catch (error) {
    console.error('Error updating plank task in database:', error);
    throw new Error('Failed to update plank task');
  }
};

// Log plank task completion
const logPlankTaskCompletion = async (taskId: string, videoPath: string, duration: number) => {
  // Ensure videoPath points to the video folder
  const normalizedVideoPath = videoPath.startsWith('exercise/standalone/video') 
    ? videoPath 
    : path.join('exercise/standalone/video', path.basename(videoPath));

  const logEntry = {
    timestamp: new Date().toISOString(),
    action: 'plank_task_completed',
    taskId,
    videoPath: normalizedVideoPath,
    duration
  };
  
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const logFilePath = path.join(logsDir, 'plank_completions.json');
    
    // Read existing logs or initialize with empty array
    let logs = [];
    try {
      const data = await fs.readFile(logFilePath, 'utf8');
      logs = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, initialize with empty array
      logs = [];
    }
    
    // Add new log entry
    logs.push(logEntry);
    
    // Save updated logs
    await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error logging plank task completion:', error);
    // Don't throw error for logging failures
  }
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { taskId, videoPath, duration } = body;
    
    // Validate required fields
    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }
    
    // Update task in database
    const updatedTask = await updatePlankTaskInDatabase(taskId, videoPath, duration);
    
    // Log task completion (non-blocking)
    logPlankTaskCompletion(taskId, videoPath, duration).catch(error => {
      console.error('Error logging plank task completion:', error);
    });
    
    // Revalidate the tasks page to reflect changes
    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: "Plank task completion updated successfully",
      task: updatedTask
    });
  } catch (error) {
    console.error('Error in plank task completion endpoint:', error);
    
    // Return error response
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
} 