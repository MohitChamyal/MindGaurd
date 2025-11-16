import requests
import os
import time
import argparse

def test_plank_analysis(video_path, server_url="http://localhost:8004"):
    """
    Test the plank analysis API by uploading a video and checking the response.
    
    Args:
        video_path: Path to the video file
        server_url: URL of the plank analysis server
    """
    if not os.path.exists(video_path):
        print(f"Error: Video file not found at {video_path}")
        return
    
    print(f"Testing plank analysis with video: {video_path}")
    print(f"Server URL: {server_url}")
    
    # Check file size
    file_size = os.path.getsize(video_path)
    print(f"Video file size: {file_size} bytes")
    
    try:
        # Upload the video for analysis
        print("\nUploading video for analysis...")
        start_time = time.time()
        
        with open(video_path, 'rb') as f:
            files = {'video': (os.path.basename(video_path), f, 'video/mp4')}
            response = requests.post(f"{server_url}/analyze-plank", files=files)
        
        # Calculate request time
        request_time = time.time() - start_time
        print(f"Request completed in {request_time:.2f} seconds")
        
        # Check response
        if response.status_code == 200:
            data = response.json()
            print("\nResponse:")
            print(f"  Success: {data.get('success', False)}")
            print(f"  Duration: {data.get('duration', 0)} seconds")
            print(f"  Treasure Awarded: {data.get('treasureAwarded', False)}")
            print(f"  Message: {data.get('message', 'No message')}")
            
            # Verify treasureAwarded logic is correct
            duration = data.get('duration', 0)
            treasure_awarded = data.get('treasureAwarded', False)
            expected_treasure = duration > 0.5
            
            if treasure_awarded == expected_treasure:
                print("\nTreasure Award Logic: CORRECT")
            else:
                print("\nTreasure Award Logic: ERROR")
                print(f"  Duration: {duration} seconds")
                print(f"  Expected treasureAwarded: {expected_treasure}")
                print(f"  Actual treasureAwarded: {treasure_awarded}")
        else:
            print(f"\nError: Received status code {response.status_code}")
            print(f"Response: {response.text}")
    
    except Exception as e:
        print(f"\nError: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the Plank Analysis API")
    parser.add_argument("video_path", help="Path to the video file")
    parser.add_argument("--server", default="http://localhost:8004", help="URL of the plank analysis server")
    
    args = parser.parse_args()
    test_plank_analysis(args.video_path, args.server) 