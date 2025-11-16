import { writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    
    if (!video) {
      return NextResponse.json({ error: 'No video uploaded' }, { status: 400 });
    }

    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to AI-Fitness-Trainer/videos/walk.mp4
    const videoPath = path.join(process.cwd(), '..', 'AI-Fitness-Trainer', 'videos', 'walk.mp4');
    await writeFile(videoPath, buffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
} 