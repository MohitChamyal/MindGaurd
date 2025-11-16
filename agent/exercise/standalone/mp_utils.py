"""
MediaPipe utilities with robust error handling for exercise detection.
"""

import os
import sys
import logging
from typing import Optional, Tuple, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mediapipe_utils")

# Global variables to track MediaPipe initialization status
MEDIAPIPE_AVAILABLE = False
MP_POSE = None
MP_DRAWING = None

try:
    import mediapipe as mp
    import cv2
    import numpy as np
    
    # Initialize MediaPipe components
    MP_POSE = mp.solutions.pose
    MP_DRAWING = mp.solutions.drawing_utils
    MEDIAPIPE_AVAILABLE = True
    logger.info("MediaPipe initialized successfully")
    
except ImportError as e:
    logger.error(f"Failed to import MediaPipe: {e}")
    logger.warning("Exercise tracking features will be disabled")
except Exception as e:
    logger.error(f"Unexpected error initializing MediaPipe: {e}")
    logger.warning("Exercise tracking features will be disabled due to initialization errors")


def create_pose_detector(
    min_detection_confidence: float = 0.5, 
    min_tracking_confidence: float = 0.5
) -> Optional[Any]:
    """
    Create a MediaPipe pose detector with error handling.
    
    Args:
        min_detection_confidence: Minimum confidence for detection
        min_tracking_confidence: Minimum confidence for tracking
        
    Returns:
        MediaPipe pose detector or None if not available
    """
    if not MEDIAPIPE_AVAILABLE:
        logger.warning("MediaPipe not available, skipping pose detector creation")
        return None
        
    try:
        detector = MP_POSE.Pose(
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        return detector
    except Exception as e:
        logger.error(f"Error creating pose detector: {e}")
        return None


def process_image(
    image: Any,
    pose_detector: Any
) -> Tuple[Optional[Any], Optional[Dict]]:
    """
    Process an image with MediaPipe and extract pose landmarks.
    
    Args:
        image: Input image (cv2/numpy format)
        pose_detector: MediaPipe pose detector instance
        
    Returns:
        Tuple of (processed image, pose results) or (None, None) on failure
    """
    if image is None or pose_detector is None:
        return None, None
        
    try:
        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image and get results
        results = pose_detector.process(image_rgb)
        
        # Convert back to BGR for display
        image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
        
        return image_bgr, results
    except Exception as e:
        logger.error(f"Error processing image with MediaPipe: {e}")
        return None, None


def draw_pose_landmarks(
    image: Any,
    pose_results: Any,
    draw_landmarks: bool = True
) -> Optional[Any]:
    """
    Draw pose landmarks on an image.
    
    Args:
        image: Input image
        pose_results: MediaPipe pose results
        draw_landmarks: Whether to draw the landmarks
        
    Returns:
        Image with landmarks drawn or None on failure
    """
    if image is None or pose_results is None or not MEDIAPIPE_AVAILABLE:
        return image
        
    try:
        if draw_landmarks and pose_results.pose_landmarks:
            # Make a copy to avoid modifying the original
            image_copy = image.copy()
            
            # Draw the pose annotations
            MP_DRAWING.draw_landmarks(
                image_copy,
                pose_results.pose_landmarks,
                MP_POSE.POSE_CONNECTIONS,
                MP_DRAWING.DrawingSpec(thickness=4, circle_radius=2, color=(0, 0, 255)),
                MP_DRAWING.DrawingSpec(thickness=2, circle_radius=1, color=(0, 255, 0))
            )
            return image_copy
        return image
    except Exception as e:
        logger.error(f"Error drawing pose landmarks: {e}")
        return image


def get_landmark_coordinates(
    image: Any,
    pose_results: Any,
    visibility_threshold: float = 0.5,
    presence_threshold: float = 0.5
) -> Dict[int, Tuple[int, int]]:
    """
    Extract landmark coordinates from pose results.
    
    Args:
        image: Input image
        pose_results: MediaPipe pose results
        visibility_threshold: Minimum visibility for landmarks
        presence_threshold: Minimum presence for landmarks
        
    Returns:
        Dictionary mapping landmark indices to (x, y) coordinates
    """
    idx_to_coordinates = {}
    
    if image is None or pose_results is None or not MEDIAPIPE_AVAILABLE:
        return idx_to_coordinates
        
    try:
        image_rows, image_cols = image.shape[:2]
        
        if pose_results.pose_landmarks:
            for idx, landmark in enumerate(pose_results.pose_landmarks.landmark):
                # Filter by visibility and presence thresholds
                if ((landmark.HasField('visibility') and landmark.visibility < visibility_threshold) or
                    (landmark.HasField('presence') and landmark.presence < presence_threshold)):
                    continue
                    
                # Convert normalized coordinates to pixel coordinates
                landmark_px = _normalized_to_pixel_coordinates(
                    landmark.x, landmark.y, image_cols, image_rows
                )
                
                if landmark_px:
                    idx_to_coordinates[idx] = landmark_px
    except Exception as e:
        logger.error(f"Error extracting landmark coordinates: {e}")
    
    return idx_to_coordinates


def _normalized_to_pixel_coordinates(
    normalized_x: float,
    normalized_y: float,
    image_width: int,
    image_height: int
) -> Optional[Tuple[int, int]]:
    """
    Convert normalized coordinates to pixel coordinates.
    
    Args:
        normalized_x: Normalized x coordinate [0.0, 1.0]
        normalized_y: Normalized y coordinate [0.0, 1.0]
        image_width: Width of the image
        image_height: Height of the image
        
    Returns:
        Tuple of (x_px, y_px) or None if coordinates are invalid
    """
    try:
        # Check if the normalized coordinates are valid
        if not (0.0 <= normalized_x <= 1.0 and 0.0 <= normalized_y <= 1.0):
            return None
            
        # Calculate pixel coordinates
        x_px = min(int(normalized_x * image_width), image_width - 1)
        y_px = min(int(normalized_y * image_height), image_height - 1)
        
        return x_px, y_px
    except Exception as e:
        logger.error(f"Error converting coordinates: {e}")
        return None 