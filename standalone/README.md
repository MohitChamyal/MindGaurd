# GymLytics Standalone Exercise Analyzers

This directory contains standalone versions of the exercise analyzers from the GymLytics project. These files are designed to run independently and have hardcoded video paths.

## Files
- `Squat_Standalone.py` - Analyzes squats in a video
- `Pushup_Standalone.py` - Analyzes push-ups in a video
- `Plank_Standalone.py` - Analyzes plank position in a video

## How to Use

### Prerequisites
Make sure you have the required libraries installed:
```
pip install mediapipe opencv-python numpy
```

### Running the Analyzers

Each file has a hardcoded video path at the bottom in the `if __name__ == "__main__"` section:

```python
# Example from Squat_Standalone.py
if __name__ == "__main__":
    # Hardcoded video path - change this to your specific video file
    video_path = "squat5.mp4" 
    # ... rest of the code
```

To use a different video, simply edit the `video_path` variable in the file you want to run.

Then run the script:

```
python Squat_Standalone.py
python Pushup_Standalone.py
python Plank_Standalone.py
```

### Output

- **Squat and Pushup Analyzers**: Will count the number of repetitions performed in the video
- **Plank Analyzer**: Will measure how long the plank position was maintained in seconds

The results are displayed on screen during analysis and printed to the console when the video ends.

## Customization

You can modify detection parameters by editing the following:
- For squats: The hip-knee distance threshold (`abs(hip_coord[1] - knee_coord[1]) < 35`)
- For push-ups: The shoulder-ankle distance threshold (`abs(shoulder_coord[1] - ankle_coord[1]) < 300`)
- For planks: The angle threshold (`160 < angle < 200`)

## Notes
- Press ESC to exit the analysis at any time
- The video window shows real-time tracking and counting 