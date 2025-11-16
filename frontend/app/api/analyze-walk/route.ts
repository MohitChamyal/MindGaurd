import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import path from 'path';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const aiTrainerPath = path.join(process.cwd(), '..', 'AI-Fitness-Trainer');
    
    // Execute the Python script
    const { stdout, stderr } = await execAsync('python main.py -t walk -vs videos/walk.mp4', {
      cwd: aiTrainerPath
    });

    // Parse the output to determine if walking was detected
    // Adjust this based on your Python script's actual output format
    const isWalking = stdout.toLowerCase().includes('walking detected');

    return NextResponse.json({ 
      isWalking,
      output: stdout,
      error: stderr 
    });
  } catch (error) {
    console.error('Error analyzing video:', error);
    return NextResponse.json({ error: 'Failed to analyze video' }, { status: 500 });
  }
} 