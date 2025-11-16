#!/usr/bin/env python
"""
Script to analyze the latest video in the frontend videos folder
and output the results in JSON format.

This can be called directly from the frontend as an alternative to using the API.
"""

import os
import sys
import json
import time
import asyncio
import cv2
import numpy as np
from datetime import datetime

# Add the parent directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys_path_modified = False

if parent_dir not in sys.path:
    sys.path.append(parent_dir)
    sys_path_modified = True

if current_dir not in sys.path:
    sys.path.append(current_dir)
    sys_path_modified = True

# Import necessary components to avoid dependency issues
import mediapipe as mp
from exercise.standalone.Plank_Standalone import Plank
from exercise.src.ThreadedCamera import ThreadedCamera

# Directory where videos are uploaded from the frontend
FRONTEND_VIDEO_DIR = os.path.join(parent_dir, "videos")

def get_latest_video(directory):
    """
    Get the most recently modified video file from the specified directory
    """
    video_files = [os.path.join(directory, f) for f in os.listdir(directory) 
                  if f.endswith('.mp4') or f.endswith('.avi') or f.endswith('.mov')]
    
    if not video_files:
        return None
    
    # Sort by modification time (most recent first)
    video_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    return video_files[0]

async def main():
    # Find the latest video in the frontend videos folder
    try:
        os.makedirs(FRONTEND_VIDEO_DIR, exist_ok=True)
        print(f"Checking for videos in: {FRONTEND_VIDEO_DIR}", file=sys.stderr)
        
        latest_video = get_latest_video(FRONTEND_VIDEO_DIR)
        
        if not latest_video:
            result = {
                "success": False,
                "error": "No videos found in the frontend videos folder",
                "treasureAwarded": False,
                "plankDetected": False
            }
            print(json.dumps(result))
            return
        
        print(f"Found latest video: {latest_video}", file=sys.stderr)
        
        # Check if the file exists and can be read
        if not os.path.exists(latest_video):
            result = {
                "success": False,
                "error": f"Video file not found: {latest_video}",
                "treasureAwarded": False,
                "plankDetected": False
            }
            print(json.dumps(result))
            return
        
        # Verify file can be opened
        cap = cv2.VideoCapture(latest_video)
        if not cap.isOpened():
            result = {
                "success": False,
                "error": f"Could not open video file: {latest_video}",
                "treasureAwarded": False,
                "plankDetected": False
            }
            print(json.dumps(result))
            return
        cap.release()
        
        # Initialize default values
        duration = 0.0
        treasure_awarded = False
        
        print(f"Analyzing latest video...", file=sys.stderr)
        
        # Perform the analysis
        plank = Plank()
        duration = await plank.exercise(latest_video, show_video=False)
        
        # Check if plank was detected and duration is sufficient for treasure
        plank_detected = getattr(plank, 'plank_detected', False)
        
        if not plank_detected:
            message = "No plank position was detected in the video. No treasure awarded."
            treasure_awarded = False
        elif duration > 0.3:  # Using 0.3 seconds threshold
            message = f"Plank position detected. Total duration: {duration} seconds. Treasure awarded!"
            treasure_awarded = True
        else:
            message = f"Plank position detected but duration was too short ({duration} seconds). Minimum 0.3 seconds required for treasure."
            treasure_awarded = False
        
        print(f"Analysis completed: Duration={duration}s, Plank detected={plank_detected}, Treasure={treasure_awarded}", file=sys.stderr)
        
        # Generate a timestamp for the response
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        result = {
            "success": True,
            "duration": duration,
            "treasureAwarded": treasure_awarded,
            "plankDetected": plank_detected,
            "message": message,
            "video_path": latest_video,
            "timestamp": timestamp
        }
        
    except Exception as e:
        import traceback
        print(f"Error during plank analysis: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        result = {
            "success": False,
            "treasureAwarded": False,
            "plankDetected": False,
            "error": str(e)
        }
    
    # Output the result as JSON
    print(json.dumps(result))

if __name__ == "__main__":
    asyncio.run(main()) 