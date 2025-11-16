import mediapipe as mp
import cv2
import time
import numpy as np
import os
import sys
import math
import argparse

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Fix imports to use relative paths
from src.ThreadedCamera import ThreadedCamera
from src.utils import get_idx_to_coordinates, rescale_frame, convert_arc, draw_ellipse

# Initialize MediaPipe pose
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# Define a proper angle calculation function
def calculate_angle(a, b, c):
    """
    Calculate the angle between three points
    Args:
        a: first point [x, y]
        b: mid point [x, y]
        c: end point [x, y]
    Returns:
        angle in degrees
    """
    a = np.array(a)  # First point
    b = np.array(b)  # Mid point
    c = np.array(c)  # End point
    
    # Calculate vectors
    ba = a - b
    bc = c - b
    
    # Calculate angle using dot product
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)  # Ensure value is within valid range
    
    angle = np.arccos(cosine_angle)
    angle = np.degrees(angle)
    
    return angle

class BicepCurls:
    def __init__(self):
        pass

    def exercise(self, source, show_video=False):
        # Initialize variables
        counter = 0
        stage = None
        empty_frame_count = 0
        
        # Track left and right arm separately
        left_stage = None
        right_stage = None
        
        # Track overall curl state (for counting both arms as one rep)
        both_arms_curled = False
        both_arms_extended = True  # Start extended
        
        # Define angle thresholds for better accuracy
        CURL_ANGLE_THRESHOLD = 70  # Angle when arm is considered curled (smaller value for tighter curl)
        EXTEND_ANGLE_THRESHOLD = 150  # Angle when arm is considered extended
        
        # Maintain a history of angles for smoothing (reduces false detections)
        left_angle_history = []
        right_angle_history = []
        history_size = 5  # Number of frames to keep for smoothing
        
        # Initialize threaded camera
        threaded_camera = ThreadedCamera(source)
        
        # Wait a bit for camera to initialize
        time.sleep(1)
        
        # Initialize pose detection with higher confidence thresholds for better accuracy
        pose = mp_pose.Pose(min_detection_confidence=0.7, min_tracking_confidence=0.7)
        
        # Print starting message
        print("Analyzing bicep curls... Please wait.")
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
                
                # Flip the image horizontally for a mirror effect
                image = cv2.flip(image, 1)
                
                # Convert the BGR image to RGB
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                # Process the image and detect poses
                results = pose.process(image_rgb)
                
                # Only draw on the image if show_video is True
                if show_video:
                    # Draw the pose annotations on the image
                    image.flags.writeable = True
                    image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
                    
                    if results.pose_landmarks:
                        mp_drawing.draw_landmarks(
                            image, 
                            results.pose_landmarks, 
                            mp_pose.POSE_CONNECTIONS,
                            mp_drawing.DrawingSpec(thickness=5, circle_radius=2, color=(0, 0, 255)),
                            mp_drawing.DrawingSpec(thickness=1, circle_radius=1, color=(0, 255, 0))
                        )
                
                if results.pose_landmarks:
                    # Get landmark coordinates
                    idx_to_coordinates = get_idx_to_coordinates(image, results)
                    
                    try:
                        # Check for required landmarks to calculate bicep curl angles
                        if (11 in idx_to_coordinates and 13 in idx_to_coordinates and 
                            15 in idx_to_coordinates and 12 in idx_to_coordinates and 
                            14 in idx_to_coordinates and 16 in idx_to_coordinates):
                            
                            # Left arm points
                            left_shoulder = idx_to_coordinates[11]
                            left_elbow = idx_to_coordinates[13]
                            left_wrist = idx_to_coordinates[15]
                            
                            # Right arm points
                            right_shoulder = idx_to_coordinates[12]
                            right_elbow = idx_to_coordinates[14]
                            right_wrist = idx_to_coordinates[16]
                            
                            # Calculate angles for both elbows using the new function
                            left_elbow_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
                            right_elbow_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
                            
                            # Add angles to history for smoothing
                            left_angle_history.append(left_elbow_angle)
                            right_angle_history.append(right_elbow_angle)
                            
                            # Keep history at fixed size
                            if len(left_angle_history) > history_size:
                                left_angle_history.pop(0)
                            if len(right_angle_history) > history_size:
                                right_angle_history.pop(0)
                            
                            # Calculate smoothed angles (average of history)
                            smooth_left_angle = sum(left_angle_history) / len(left_angle_history)
                            smooth_right_angle = sum(right_angle_history) / len(right_angle_history)
                            
                            # Only draw on image if show_video is True
                            if show_video:
                                # Draw angles on image
                                cv2.putText(image, f"L: {int(smooth_left_angle)}", 
                                          (left_elbow[0]-60, left_elbow[1]+30), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
                                
                                cv2.putText(image, f"R: {int(smooth_right_angle)}", 
                                          (right_elbow[0]+10, right_elbow[1]+30), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
                                
                                # Draw the arm lines for visualization
                                # Left arm
                                cv2.line(image, left_shoulder, left_elbow, (255, 255, 0), 3)
                                cv2.line(image, left_elbow, left_wrist, (255, 255, 0), 3)
                                # Right arm
                                cv2.line(image, right_shoulder, right_elbow, (255, 255, 0), 3)
                                cv2.line(image, right_elbow, right_wrist, (255, 255, 0), 3)
                            
                            # Track individual arm states for monitoring
                            # Left arm curl detection with smoothed angles
                            if smooth_left_angle < CURL_ANGLE_THRESHOLD and left_stage != 'curled':
                                left_stage = 'curled'
                                # Visual indicator for left arm curl
                                if show_video:
                                    cv2.putText(image, 'L CURLED', (50, 150),
                                             cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
                            
                            if smooth_left_angle > EXTEND_ANGLE_THRESHOLD and left_stage == 'curled':
                                left_stage = 'extended'
                            
                            # Right arm curl detection with smoothed angles
                            if smooth_right_angle < CURL_ANGLE_THRESHOLD and right_stage != 'curled':
                                right_stage = 'curled'
                                # Visual indicator for right arm curl
                                if show_video:
                                    cv2.putText(image, 'R CURLED', (50, 180),
                                             cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
                            
                            if smooth_right_angle > EXTEND_ANGLE_THRESHOLD and right_stage == 'curled':
                                right_stage = 'extended'
                            
                            # NEW LOGIC: Count both arms as one rep when moving together
                            # Check if both arms are curled
                            if (left_stage == 'curled' and right_stage == 'curled' and not both_arms_curled):
                                both_arms_curled = True
                                both_arms_extended = False
                                if show_video:
                                    cv2.putText(image, 'BOTH ARMS CURLED', (50, 210),
                                             cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2, cv2.LINE_AA)
                            
                            # Check if both arms are extended and were previously curled
                            if (left_stage == 'extended' and right_stage == 'extended' and 
                                both_arms_curled and not both_arms_extended):
                                both_arms_extended = True
                                both_arms_curled = False
                                counter += 1
                                print(f"Complete bicep curl detected. Total count: {counter}")
                                if show_video:
                                    cv2.putText(image, f"CURL COUNTED!", (50, 240),
                                             cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
                            
                            # Track overall exercise stage for display purposes
                            if left_stage == 'curled' or right_stage == 'curled':
                                stage = 'curled'
                            elif left_stage == 'extended' and right_stage == 'extended':
                                stage = 'extended'
                            
                            # Only draw status indicators if show_video is True
                            if show_video:
                                # Draw arm status indicators
                                left_status = "CURLED" if left_stage == 'curled' else "EXTENDED"
                                right_status = "CURLED" if right_stage == 'curled' else "EXTENDED"
                                exercise_state = "CURLED" if both_arms_curled else "EXTENDED"
                                
                                cv2.putText(image, f"L ARM: {left_status}", 
                                          (10, 320), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
                                
                                cv2.putText(image, f"R ARM: {right_status}", 
                                          (10, 350), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
                                
                                cv2.putText(image, f"EXERCISE STATE: {exercise_state}", 
                                          (10, 380), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
                                
                                # Add a threshold line visualization
                                cv2.putText(image, f"CURL THRESHOLD: {CURL_ANGLE_THRESHOLD}°", 
                                          (10, 410), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1, cv2.LINE_AA)
                                cv2.putText(image, f"EXTEND THRESHOLD: {EXTEND_ANGLE_THRESHOLD}°", 
                                          (10, 440), 
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1, cv2.LINE_AA)
                    except:
                        pass
                
                # Display bicep curl count on the image only if show_video is True
                if show_video:
                    cv2.putText(image, f'BICEP CURLS: {counter}', (50, 50), 
                              cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2, cv2.LINE_AA)
                    
                    # Display the resulting frame
                    cv2.imshow('Bicep Curl Analysis', rescale_frame(image, percent=100))
                    
                    # Exit if ESC is pressed
                    if cv2.waitKey(5) & 0xFF == 27:
                        break
        finally:
            # Clean up resources
            pose.close()
            if show_video:
                cv2.destroyAllWindows()
            threaded_camera.release()
            print("=" * 40)
        
        # Return the bicep curl count
        return counter


# Run this file directly with a hardcoded video path
if __name__ == "__main__":
    # Set up command line argument parsing
    parser = argparse.ArgumentParser(description='Analyze bicep curl exercise from video.')
    parser.add_argument('--video', type=str, help='Path to the video file')
    parser.add_argument('--show', action='store_true', help='Show video playback with analysis')
    args = parser.parse_args()
    
    # Use command line argument if provided, otherwise use hardcoded path to squat1.mp4 for testing
    video_path = args.video if args.video else os.path.join(os.path.dirname(os.path.dirname(__file__)), "squat1.mp4")
    
    # Check if the file exists
    if not os.path.exists(video_path):
        print(f"Error: Video file '{video_path}' not found.")
        sys.exit(1)
    
    print(f"Analyzing bicep curl exercise from video: {video_path}")
    
    # Process the video - set show_video to True by default to show video window
    bicep_curls = BicepCurls()
    # Use args.show if specifically set, otherwise default to True
    show_video = args.show if args.show is not None else True
    count = bicep_curls.exercise(video_path, show_video=show_video)
    
    # Print the results
    print(f"Total bicep curl count: {count}") 