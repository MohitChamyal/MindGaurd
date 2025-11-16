"""
Utility script to download models for offline use.

Run this script to download the emotion analysis model and other needed resources
for offline usage of the MindGuard application.
"""

import os
import argparse
from agent.emotion_analysis import EmotionAnalyzer

def main():
    parser = argparse.ArgumentParser(description="Download models for offline use")
    parser.add_argument(
        "--cache-dir", 
        type=str, 
        default="./cached_models",
        help="Directory to cache models"
    )
    args = parser.parse_args()
    
    print("Starting model download for offline use...")
    
    # Create cache directory
    os.makedirs(args.cache_dir, exist_ok=True)
    
    # Download emotion analysis model
    print("\n[1/1] Downloading emotion analysis model...")
    analyzer = EmotionAnalyzer(cache_dir=args.cache_dir)
    success = analyzer.download_models_for_offline()
    
    if success:
        print("\n✅ Emotion analysis model downloaded successfully!")
        print(f"   Models saved to: {args.cache_dir}")
    else:
        print("\n❌ Failed to download emotion analysis model.")
        print("   Please check your internet connection and try again.")
    
    print("\nDownload process complete!")
    print("You can now use MindGuard in offline mode.")
    print("\nTo use offline mode, update your code to initialize the EmotionAnalyzer with:")
    print("EmotionAnalyzer(offline_mode=True, cache_dir=\"./cached_models\")")


if __name__ == "__main__":
    main() 