import cv2
import time
import numpy as np
import os
import sys
import logging
import argparse
import asyncio

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("pushup_exercise")

# Import utilities with error handling
from src.ThreadedCamera import ThreadedCamera
from mp_utils import (
    create_pose_detector,
    process_image, 
    draw_pose_landmarks,
    get_landmark_coordinates,
    MEDIAPIPE_AVAILABLE
)

class Pushup:
    def __init__(self):
        """Initialize the Pushup exercise detector"""
        # Check if MediaPipe is available
        if not MEDIAPIPE_AVAILABLE:
            logger.warning("MediaPipe is not available. Pushup detection will be limited.")
        
    def process_frame(self, frame, target_width=640):
        """
        Preprocess the frame to ensure consistent processing regardless of video size/orientation
        
        Args:
            frame: Input video frame
            target_width: Target width for resizing
            
        Returns:
            Processed frame or None if input is invalid
        """
        if frame is None:
            return None
            
        try:
            # Get original dimensions
            h, w = frame.shape[:2]
            
            # Calculate new height while maintaining aspect ratio
            target_height = int(h * (target_width / w))
            
            # Resize frame to target dimensions
            resized_frame = cv2.resize(frame, (target_width, target_height))
            
            return resized_frame
        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return None

    async def exercise(self, source, show_video=False):
        """
        Analyze a video for pushup exercises
        
        Args:
            source: Video source (file path or camera index)
            show_video: Whether to display the video while processing
            
        Returns:
            Number of pushups detected
        """
        # Initialize variables
        pushup_count = 0
        performing_pushup = False
        empty_frame_count = 0
        start_time = time.time()
        
        # Initialize media capture
        try:
            threaded_camera = ThreadedCamera(source)
            time.sleep(1)  # Allow camera to initialize
        except Exception as e:
            logger.error(f"Error initializing camera: {e}")
            return 0
        
        # Create pose detector with error handling
        pose_detector = create_pose_detector(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        if pose_detector is None:
            logger.error("Failed to initialize pose detector. Cannot perform pushup detection.")
            return 0
        
        # Print starting message
        logger.info(f"Analyzing pushups from {source}... Please wait.")
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
                
                # Process the image with MediaPipe
                display_image, results = process_image(processed_image, pose_detector)
                
                if display_image is None or results is None:
                    continue
                    
                # Draw pose landmarks if showing video
                if show_video:
                    display_image = draw_pose_landmarks(display_image, results)
                
                # Only proceed with landmark analysis if we have results
                if results and results.pose_landmarks:
                    # Get landmark coordinates
                    idx_to_coordinates = get_landmark_coordinates(processed_image, results)
                    
                    # Dynamic threshold calculation based on image dimensions
                    # This helps with videos of different sizes/orientations
                    height = processed_image.shape[0]
                    pushup_threshold = height * 0.3  # 30% of image height
                    
                    try:
                        # Use right or left shoulder depending on what's visible
                        shoulder_coord = None
                        if 12 in idx_to_coordinates:
                            shoulder_coord = idx_to_coordinates[12]
                        elif 11 in idx_to_coordinates:
                            shoulder_coord = idx_to_coordinates[11]
                            
                        # Use right or left ankle depending on what's visible
                        ankle_coord = None
                        if 16 in idx_to_coordinates:
                            ankle_coord = idx_to_coordinates[16]
                        elif 15 in idx_to_coordinates:
                            ankle_coord = idx_to_coordinates[15]

                        # Only proceed if we have both shoulder and ankle coordinates
                        if shoulder_coord and ankle_coord:
                            # Calculate vertical distance between shoulder and ankle
                            shoulder_ankle_distance = abs(shoulder_coord[1] - ankle_coord[1])
                            
                            # Check if in pushup position (shoulder close to ankle level)
                            if shoulder_ankle_distance < pushup_threshold:
                                if not performing_pushup:
                                    performing_pushup = True
                                    if show_video:
                                        # Draw indicator for down position
                                        cv2.putText(display_image, "DOWN POSITION", (50, 150),
                                                 cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
                            
                            # Check if completed pushup (shoulder far from ankle level while previously down)
                            if shoulder_ankle_distance > pushup_threshold and performing_pushup:
                                pushup_count += 1
                                performing_pushup = False
                                logger.info(f"Push-up count: {pushup_count}")
                                if show_video:
                                    # Draw indicator for pushup completion
                                    cv2.putText(display_image, "PUSHUP COMPLETE!", (50, 180),
                                             cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
                    except Exception as e:
                        logger.error(f"Error analyzing landmarks: {e}")
                        continue
                    
                    # Display the count on the image if showing video
                    if show_video and idx_to_coordinates:
                        cv2.putText(display_image, "PUSHUPS: " + str(pushup_count),
                                  (50, 50),
                                  fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                                  fontScale=1, color=(0, 0, 0), thickness=2)
                
                # Display the resulting frame if show_video is True
                if show_video:
                    try:
                        # Show with original aspect ratio
                        cv2.imshow('Push-up Analysis', display_image)
                        
                        # Exit if ESC is pressed
                        if cv2.waitKey(5) & 0xFF == 27:
                            break
                    except Exception as e:
                        logger.error(f"Error displaying video: {e}")
                        show_video = False  # Disable video display if error occurs
                        
                # For performance reasons, add a small delay
                await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Error in exercise analysis: {e}")
        finally:
            # Clean up resources
            try:
                if pose_detector:
                    pose_detector.close()
                if show_video:
                    cv2.destroyAllWindows()
                threaded_camera.release()
            except Exception as e:
                logger.error(f"Error during cleanup: {e}")
            
            elapsed = time.time() - start_time
            print("=" * 40)
            print(f"Analysis completed in {elapsed:.2f} seconds")
            
            # Report results in a format similar to Plank script
            if pushup_count > 0:
                print(f"Total pushups completed: {pushup_count}")
                print("Congratulations! You've earned a treasure!")
            else:
                print("No push-ups detected in the video. Try again!")
        
        return pushup_count


async def main():
    parser = argparse.ArgumentParser(description='Analyze a video for pushup exercises.')
    parser.add_argument('--video', type=str, help='Path to the video file')
    parser.add_argument('--show', action='store_true', help='Show video playback with analysis')
    args = parser.parse_args()
    
    video_path = args.video
    show_video = args.show if args.show is not None else True  # Default to True now
    
    # Check if video file exists
    if not video_path:
        logger.error("Please provide a video file path using the --video argument")
        return 0
    
    if not os.path.exists(video_path):
        logger.error(f"Error: Video file not found at {video_path}")
        return 0
    
    # Process the video
    pushup = Pushup()
    count = await pushup.exercise(video_path, show_video=show_video)
    
    # Print the results
    print(f"Total pushup count: {count}")
    if count > 0:
        print("Treasure awarded!")
    else:
        print("No treasure awarded. Try again with better form!")
    
    return count

if __name__ == "__main__":
    asyncio.run(main()) 