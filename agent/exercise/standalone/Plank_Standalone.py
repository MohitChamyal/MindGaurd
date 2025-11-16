#!/usr/bin/env python
"""
Standalone script to analyze plank exercise from a video file
"""

import cv2
import mediapipe as mp
import numpy as np
import asyncio
import time
import argparse
import os

class Plank:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.start_time = None
        self.end_time = None
        self.total_duration = 0.0
        self.plank_detected = False
        self.plank_active = False  # Track if plank position is currently active
        self.last_printed = 0  # Track last time we printed the duration
        
    def calculate_angle(self, a, b, c):
        """
        Calculate the angle between three points.
        """
        if any(point is None or np.isnan(point[0]) or np.isnan(point[1]) for point in [a, b, c]):
            return None
        
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle
    
    def is_plank_position(self, landmarks):
        """
        Check if the current pose is a plank position based on angles.
        Returns True if the person is in a plank position, False otherwise.
        """
        if landmarks is None:
            return False
            
        try:
            # Extract key points
            shoulder = [landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            elbow = [landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                     landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            wrist = [landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                     landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            
            hip = [landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].x,
                   landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].y]
            knee = [landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                   landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            ankle = [landmarks[self.mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                    landmarks[self.mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
            
            # Calculate angles
            elbow_angle = self.calculate_angle(shoulder, elbow, wrist)
            hip_angle = self.calculate_angle(shoulder, hip, knee)
            knee_angle = self.calculate_angle(hip, knee, ankle)
            
            # Check for plank position (straight body from shoulders to ankles)
            # Plank position typically has the elbow at ~90 degrees, and the body straight (hip and knee ~180 degrees)
            if (elbow_angle is not None and hip_angle is not None and knee_angle is not None and
                80 <= elbow_angle <= 110 and  # Elbow should be ~90 degrees
                160 <= hip_angle <= 195 and   # Hip should be ~180 degrees (straight)
                160 <= knee_angle <= 195):    # Knee should be ~180 degrees (straight)
                return True
                
        except Exception as e:
            print(f"Error in plank detection: {e}")
            return False
            
        return False
        
    async def exercise(self, video_path, show_video=True):
        """
        Process a video file to detect plank exercise.
        Returns the duration in seconds that the person held the plank position.
        """
        # Initialize vars
        self.plank_detected = False
        self.plank_active = False
        self.start_time = None
        self.end_time = None
        self.total_duration = 0.0
        self.last_printed = 0
        
        # Verify video path exists
        if not os.path.exists(video_path):
            print(f"Error: Video file not found at {video_path}")
            return 0.0
            
        # Open the video file
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Error: Could not open video file at {video_path}")
            return 0.0
            
        # Track start time for performance
        performance_start = time.time()
        print(f"Starting plank analysis on {video_path}")
        
        # Ensure show_video is set to True by default in case it was passed as None or False
        show_video = True if show_video is None else show_video
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Convert the BGR image to RGB
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process the image to find poses
            results = self.pose.process(image)
            
            # Convert back to BGR for OpenCV display
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            # Check if plank position is detected
            if results.pose_landmarks:
                if self.is_plank_position(results.pose_landmarks.landmark):
                    if not self.plank_active:
                        self.plank_active = True
                        self.plank_detected = True
                        self.start_time = time.time()
                        print("Plank position detected! Starting timer.")
                else:
                    if self.plank_active:
                        self.plank_active = False
                        self.end_time = time.time()
                        duration = self.end_time - self.start_time
                        self.total_duration += duration
                        print(f"Plank position ended. Duration: {duration:.2f} seconds")
                        
                # Display the landmarks on the image
                self.mp_drawing.draw_landmarks(
                    image, results.pose_landmarks, self.mp_pose.POSE_CONNECTIONS)
                
                # If plank is currently active, update the current duration
                if self.plank_active:
                    current_duration = time.time() - self.start_time
                    self.total_duration = current_duration  # Keep updating total duration
                    
                    # Only print every 5 seconds to avoid console spam
                    if time.time() - self.last_printed >= 5:
                        print(f"Current plank duration: {current_duration:.2f} seconds")
                        self.last_printed = time.time()
                    
                    # Display current duration on frame
                    cv2.putText(image, f"Duration: {current_duration:.2f}s", 
                                (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                    cv2.putText(image, "Plank Detected!", 
                                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                else:
                    cv2.putText(image, "Not in plank position", 
                                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            else:
                # No pose detected
                cv2.putText(image, "No pose detected", 
                            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
            # Show the frame if requested
            if show_video:
                cv2.imshow('Plank Exercise', image)
                
                # Exit if 'q' is pressed
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                    
            # For performance reasons, add a small delay
            await asyncio.sleep(0.01)
        
        # Release resources
        cap.release()
        if show_video:
            cv2.destroyAllWindows()
            
        # If plank is still active at the end of the video, add the duration
        if self.plank_active and self.start_time is not None:
            self.end_time = time.time()
            duration = self.end_time - self.start_time
            self.total_duration += duration
            
        # Report results
        elapsed = time.time() - performance_start
        print(f"Analysis completed in {elapsed:.2f} seconds")
        
        if self.plank_detected:
            print(f"Plank position maintained for {self.total_duration:.2f} seconds")
            if self.total_duration > 0.3:  # Using threshold of 0.3 seconds
                print("Congratulations! You've earned a treasure!")
            else:
                print(f"Need to hold plank for longer than 0.3 seconds to earn a treasure. You held for {self.total_duration:.2f} seconds.")
        else:
            print("No plank position detected in the video. Try again!")
            
        return self.total_duration

async def main():
    parser = argparse.ArgumentParser(description='Analyze a video for plank exercise.')
    parser.add_argument('--video', type=str, help='Path to the video file')
    parser.add_argument('--show', action='store_true', help='Show video playback with analysis')
    args = parser.parse_args()
    
    video_path = args.video
    show_video = args.show if args.show is not None else True  # Default to True
    
    # Check if video file exists
    if not video_path:
        print("Please provide a video file path using the --video argument")
        return
    
    if not os.path.exists(video_path):
        print(f"Error: Video file not found at {video_path}")
        return
    
    # Create Plank object and analyze the video
    plank = Plank()
    duration = await plank.exercise(video_path, show_video=show_video)
    
    print(f"Total plank duration: {duration:.2f} seconds")
    if duration > 0.3:  # Threshold for awarding treasure
        print("Treasure awarded!")
    else:
        print("No treasure awarded. Try to hold the plank position longer!")

if __name__ == "__main__":
    asyncio.run(main())