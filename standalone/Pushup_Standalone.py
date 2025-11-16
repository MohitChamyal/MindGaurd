import mediapipe as mp
import cv2
import time
import numpy as np
import os
import sys

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Fix imports to use relative paths
from src.ThreadedCamera import ThreadedCamera
from src.utils import get_idx_to_coordinates, rescale_frame, ang, convert_arc, draw_ellipse

# Initialize MediaPipe pose
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

class Pushup:
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
        scount = 0
        performedPushUp = False
        empty_frame_count = 0
        
        # Initialize threaded camera
        threaded_camera = ThreadedCamera(source)
        
        # Wait a bit for camera to initialize
        time.sleep(1)
        
        # Initialize pose detection
        pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        
        # Print starting message
        print("Analyzing pushups... Please wait.")
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
                
                # Only process further if we need to show video
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
                    
                    # Dynamic threshold calculation based on image dimensions
                    # This helps with videos of different sizes/orientations
                    height = processed_image.shape[0]
                    pushup_threshold = height * 0.3  # 30% of image height
                    
                    try:
                        # Count Number of Pushups
                        if 12 in idx_to_coordinates:
                            shoulder_coord = idx_to_coordinates[12]
                        else:
                            shoulder_coord = idx_to_coordinates[11]

                        if 16 in idx_to_coordinates:
                            ankle_coord = idx_to_coordinates[16]
                        else:
                            ankle_coord = idx_to_coordinates[15]

                        # Calculate vertical distance between shoulder and ankle
                        shoulder_ankle_distance = abs(shoulder_coord[1] - ankle_coord[1])
                        
                        # Check if in pushup position (shoulder close to ankle level)
                        if shoulder_ankle_distance < pushup_threshold:
                            if not performedPushUp:
                                performedPushUp = True
                                if show_video:
                                    # Draw indicator for down position
                                    cv2.putText(display_image, "DOWN POSITION", (50, 150),
                                             cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
                        
                        # Check if completed pushup (shoulder far from ankle level while previously down)
                        if shoulder_ankle_distance > pushup_threshold and performedPushUp:
                            scount += 1
                            performedPushUp = False
                            print(f"Push-up count: {scount}")
                            if show_video:
                                # Draw indicator for pushup completion
                                cv2.putText(display_image, "PUSHUP COMPLETE!", (50, 180),
                                         cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)

                    except:
                        pass
                    
                    # Display the count on the image if showing video
                    if show_video and 0 in idx_to_coordinates:
                        cv2.putText(display_image, "PUSHUPS: " + str(scount),
                                  (50, 50),
                                  fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                                  fontScale=1, color=(0, 0, 0), thickness=2)
                
                # Display the resulting frame if show_video is True
                if show_video:
                    # Show with original aspect ratio
                    cv2.imshow('Push-up Analysis', display_image)
                    
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
        
        return scount


# Run this file directly with a hardcoded video path
if __name__ == "__main__":
    # Hardcoded video path - change this to your specific video file
    video_path = "push1.mp4"
    
    # Check if the file exists
    if not os.path.exists(video_path):
        print(f"Error: Video file '{video_path}' not found.")
        sys.exit(1)
    
    print(f"Analyzing push-up exercise from video: {video_path}")
    
    # Process the video - set show_video to False to disable video window
    pushup = Pushup()
    count = pushup.exercise(video_path, show_video=False)
    
    # Print the results
    if count > 0:
        print(f"Completed {count} push-ups in the video.")
    else:
        print("No push-ups detected in the video.") 