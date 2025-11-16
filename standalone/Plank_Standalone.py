import mediapipe as mp
import cv2
import time
import numpy as np
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)
    
from src.ThreadedCamera import ThreadedCamera
from src.utils import *

mp_drawing = mp.solutions.drawing_utils
mp_holistic = mp.solutions.holistic
mp_pose = mp.solutions.pose

class Plank():
    def __init__(self):
        pass
        
    def process_frame(self, frame, target_width=640):
        """
        Preprocess the frame to ensure consistent processing regardless of video size/orientation
        """
        if frame is None:
            return None
            
        # Get original dimensions
        h, w = frame.shape[:2]
        
        # Calculate new height while maintaining aspect ratio
        target_height = int(h * (target_width / w))
        
        # Resize frame to target dimensions
        resized_frame = cv2.resize(frame, (target_width, target_height))
        
        return resized_frame

    def exercise(self, source, show_video=False):
        # Initialize variables
        plankTimer = None
        plankDuration = 0
        empty_frame_count = 0
        isInPlankPosition = False
        
        # Initialize threaded camera
        threaded_camera = ThreadedCamera(source)
        
        # Wait a bit for camera to initialize
        time.sleep(1)
        
        # Initialize pose detection
        pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        
        # Print starting message
        print("Analyzing plank exercise... Please wait.")
        print("=" * 40)
        
        try:
            while True:
                # Get a frame from the video source
                success, image = threaded_camera.show_frame()
                
                # Check if we've reached the end of the video
                if not success or image is None:
                    empty_frame_count += 1
                    if empty_frame_count > 10:  # If 10 consecutive frames are empty, assume video ended
                        break
                    continue
                
                # Reset empty frame counter when we get a valid frame
                empty_frame_count = 0
                
                # Process frame to handle different video sizes/orientations
                processed_image = self.process_frame(image)
                if processed_image is None:
                    continue
                
                # Flip the image horizontally for a mirror effect
                processed_image = cv2.flip(processed_image, 1)
                
                # Convert the BGR image to RGB
                image_rgb = cv2.cvtColor(processed_image, cv2.COLOR_BGR2RGB)
                
                # Process the image and detect poses
                results = pose.process(image_rgb)
                
                # Only process display if show_video is True
                if show_video:
                    # Draw the pose annotations on the image
                    processed_image.flags.writeable = True
                    display_image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
                    
                    if results.pose_landmarks:
                        mp_drawing.draw_landmarks(
                            display_image, 
                            results.pose_landmarks, 
                            mp_pose.POSE_CONNECTIONS,
                            mp_drawing.DrawingSpec(thickness=5, circle_radius=2, color=(0, 0, 255)),
                            mp_drawing.DrawingSpec(thickness=1, circle_radius=1, color=(0, 255, 0))
                        )
                
                if results.pose_landmarks:
                    # Get landmark coordinates
                    idx_to_coordinates = get_idx_to_coordinates(processed_image, results)
                    
                    # Try to analyze plank position
                    try:
                        # Check if body is in plank position by analyzing shoulders, hips, and ankles
                        isInPlankPositionNow = False
                        
                        # Check shoulder-hip-ankle alignment (straight back)
                        if (11 in idx_to_coordinates and 23 in idx_to_coordinates and 27 in idx_to_coordinates):
                            # Get angle between shoulder-hip-ankle
                            angle = ang((idx_to_coordinates[11], idx_to_coordinates[23]),
                                        (idx_to_coordinates[23], idx_to_coordinates[27]))
                            
                            # If angle is close to 180 degrees (straight line), body is in plank position
                            if 160 < angle < 200:
                                isInPlankPositionNow = True
                        
                        # Start/stop plank timer based on position
                        if isInPlankPositionNow and not isInPlankPosition:
                            # Started plank position
                            plankTimer = time.time()
                            isInPlankPosition = True
                            print("Plank position started")
                        elif not isInPlankPositionNow and isInPlankPosition:
                            # Ended plank position
                            if plankTimer is not None:
                                duration = time.time() - plankTimer
                                plankDuration += duration
                                print(f"Plank position ended. Duration: {duration:.1f}s")
                                plankTimer = None
                            isInPlankPosition = False
                            
                        # Update ongoing plank timing
                        current_duration = plankDuration
                        if isInPlankPosition and plankTimer is not None:
                            current_duration += time.time() - plankTimer
                            # Print current duration every 5 seconds
                            if int(current_duration) % 5 == 0 and int(current_duration) > 0:
                                seconds_mark = int(current_duration)
                                # Only print once per 5-second mark
                                if not hasattr(self, 'last_printed') or self.last_printed != seconds_mark:
                                    print(f"Current plank duration: {current_duration:.1f}s")
                                    self.last_printed = seconds_mark
                            
                        # Display the duration on the image if showing video
                        if show_video and 0 in idx_to_coordinates:
                            cv2.putText(display_image, f"Plank Time: {current_duration:.1f}s", 
                                       (idx_to_coordinates[0][0] - 80, idx_to_coordinates[0][1] - 80),
                                       fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                                       fontScale=0.9, color=(0, 0, 0), thickness=2)
                            
                            # Show status
                            status = "HOLDING PLANK" if isInPlankPosition else "NOT IN POSITION"
                            color = (0, 255, 0) if isInPlankPosition else (0, 0, 255)
                            cv2.putText(display_image, status,
                                       (idx_to_coordinates[0][0] - 80, idx_to_coordinates[0][1] - 40),
                                       fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                                       fontScale=0.9, color=color, thickness=2)
                    except:
                        pass
                
                # Display the resulting frame if showing video
                if show_video:
                    # Show original aspect ratio with proper sizing
                    cv2.imshow('Plank Analysis', display_image)
                    
                    # Exit if ESC is pressed
                    if cv2.waitKey(5) & 0xFF == 27:
                        break
                    
            # If still in plank position at the end, add the final time
            if isInPlankPosition and plankTimer is not None:
                final_duration = time.time() - plankTimer
                plankDuration += final_duration
                print(f"Final plank segment: {final_duration:.1f}s")
                
        finally:
            # Clean up resources
            pose.close()
            if show_video:
                cv2.destroyAllWindows()
            threaded_camera.release()
            print("=" * 40)
        
        # Return the plank duration in seconds
        return round(plankDuration, 1)


# Allow this file to be run independently
if __name__ == "__main__":
    # Hardcoded video path - change this to your specific video file
    video_path = "squat2.mp4"
    
    # Check if the file exists
    if not os.path.exists(video_path):
        print(f"Error: Video file '{video_path}' not found.")
        sys.exit(1)
    
    print(f"Analyzing plank exercise from video: {video_path}")
    
    # Process the video - set show_video to False to disable video window
    plank = Plank()
    duration = plank.exercise(video_path, show_video=True)
    
    # Print the results
    if duration > 0:
        print(f"Maintained plank position for {duration} seconds in the video.")
    else:
        print("No plank position detected in the video.")
