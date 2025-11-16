#!/usr/bin/env python3
import os
import json
import sys

# Simple test to verify file output works
def main():
    print("Testing file output...")
    
    # Get output path from command line or use default
    output_path = sys.argv[1] if len(sys.argv) > 1 else "test_output.json"
    
    # Create simple test data
    test_data = {
        "test": True,
        "message": "This is a test file",
        "path": output_path
    }
    
    # Save to file
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(test_data, f, indent=2)
        print(f"Successfully saved test data to: {output_path}")
        return 0
    except Exception as e:
        print(f"Error saving file: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 