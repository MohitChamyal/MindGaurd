import os
import sys

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Import exercise classes
from BicepCurls_Standalone import BicepCurls
from Plank_Standalone import Plank
from Pushup_Standalone import Pushup
from Squats_Standalone import Squats

# Define video paths relative to the parent directory
parent_dir = os.path.dirname(current_dir)
VIDEO_PATHS = {
    "bicep": os.path.join(parent_dir, "curl1.mp4"),
    "plank": os.path.join(parent_dir, "plank1.mp4"),
    "pushup": os.path.join(parent_dir, "push1.mp4"),
    "squat": os.path.join(parent_dir, "squat1.mp4")
}

def run_bicep_curls():
    """Run the bicep curls exercise program"""
    print("Starting Bicep Curls exercise...")
    exercise = BicepCurls()
    result = exercise.exercise(VIDEO_PATHS["bicep"], show_video=False)
    print(f"Bicep Curls completed with result: {result}")
    return result

def run_plank():
    """Run the plank exercise program"""
    print("Starting Plank exercise...")
    exercise = Plank()
    result = exercise.exercise(VIDEO_PATHS["plank"], show_video=False)
    print(f"Plank completed with duration: {result} seconds")
    return result

def run_pushup():
    """Run the pushup exercise program"""
    print("Starting Pushup exercise...")
    exercise = Pushup()
    result = exercise.exercise(VIDEO_PATHS["pushup"], show_video=False)
    print(f"Pushups completed with result: {result}")
    return result

def run_squats():
    """Run the squats exercise program"""
    print("Starting Squats exercise...")
    exercise = Squats()
    result = exercise.exercise(VIDEO_PATHS["squat"], show_video=False)
    print(f"Squats completed with result: {result}")
    return result

def show_menu():
    """Display menu and get user choice"""
    print("\n===== EXERCISE ANALYZER MENU =====")
    print("1. Bicep Curls")
    print("2. Plank")
    print("3. Pushup")
    print("4. Squat")
    print("5. Exit")
    print("=================================")
    
    choice = input("Enter your choice (1-5): ")
    return choice

def main():
    while True:
        choice = show_menu()
        
        if choice == "1":
            run_bicep_curls()
        elif choice == "2":
            run_plank()
        elif choice == "3":
            run_pushup()
        elif choice == "4":
            run_squats()
        elif choice == "5":
            print("Exiting program.")
            return 0
        else:
            print("Invalid choice. Please enter a number between 1 and 5.")
        
        # Wait for user to continue
        input("\nPress Enter to continue...")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())