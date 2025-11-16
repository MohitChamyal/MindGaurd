from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from pathlib import Path
import subprocess
import json
import logging
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS with more specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Server is running"}

@app.post("/analyze-plank")
async def analyze_plank(video: UploadFile = File(...)):
    logger.info(f"Received video file: {video.filename}")
    try:
        # Validate file type
        if not video.filename.endswith(('.mp4', '.mov', '.avi')):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video file.")

        # Save the uploaded video
        video_path = UPLOAD_DIR / "plank_video.mp4"
        logger.info(f"Saving video to: {video_path}")
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        # Run the Plank_Standalone.py script
        logger.info("Running Plank_Standalone.py script")
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exercise", "standalone", "Plank_Standalone.py")
        result = subprocess.run(
            ["python", script_path, str(video_path)],
            capture_output=True,
            text=True
        )
        
        logger.info(f"Script output: {result.stdout}")
        logger.info(f"Script error: {result.stderr}")
        
        # Parse the output to get the plank duration
        output_lines = result.stdout.split('\n')
        plank_duration = 0
        for line in output_lines:
            if "Maintained plank position for" in line:
                try:
                    plank_duration = float(line.split("for")[1].split("seconds")[0].strip())
                    logger.info(f"Found plank duration: {plank_duration}")
                    break
                except Exception as e:
                    logger.error(f"Error parsing duration: {e}")
        
        # Check if the analysis was successful
        if result.returncode == 0:
            # Define minimum duration for a successful plank (in seconds)
            MIN_PLANK_DURATION = 3  # 3 seconds minimum
            
            if plank_duration >= MIN_PLANK_DURATION:
                response = {
                    "success": True,
                    "duration": plank_duration,
                    "message": f"Plank analysis completed successfully. You held the plank for {plank_duration} seconds!"
                }
            else:
                response = {
                    "success": False,
                    "duration": plank_duration,
                    "message": f"Plank duration too short. You held the plank for {plank_duration} seconds, but need at least {MIN_PLANK_DURATION} seconds."
                }
            logger.info(f"Returning response: {response}")
            return response
        else:
            raise HTTPException(status_code=500, detail="Failed to analyze plank video")
            
    except HTTPException as he:
        logger.error(f"HTTP Exception: {he}")
        raise he
    except Exception as e:
        logger.error(f"Error in analyze_plank: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the uploaded file
        if 'video_path' in locals() and video_path.exists():
            logger.info("Cleaning up uploaded video file")
            video_path.unlink()

if __name__ == "__main__":
    logger.info("Starting server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Changed from 127.0.0.1 to 0.0.0.0
        port=8001,
        reload=True,
        log_level="debug"
    ) 