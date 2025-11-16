#!/usr/bin/env python3
"""
Test script for PDF Questionnaire Analyzer
This script tests the PDF analyzer by processing a sample PDF file and displaying the results.
"""
import os
import sys
import json
import argparse
from datetime import datetime

# Ensure the current directory is in the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def print_colored(text, color="default"):
    """Print text in color."""
    colors = {
        "red": "\033[91m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "magenta": "\033[95m",
        "cyan": "\033[96m",
        "default": "\033[0m"
    }
    
    end_color = "\033[0m"
    color_code = colors.get(color, colors["default"])
    print(f"{color_code}{text}{end_color}")

def print_section(title):
    """Print a section title."""
    print("\n" + "=" * 80)
    print_colored(f" {title} ".center(80, "="), "blue")
    print("=" * 80)

def print_json(data, indent=2):
    """Print JSON data in a formatted way."""
    print(json.dumps(data, indent=indent))

def test_pdf_analyzer(pdf_path=None, output_path=None):
    """Test the PDF analyzer with a sample PDF file."""
    try:
        from pdf_questionnaire_analyzer import QuestionnaireAnalyzer
    except ImportError as e:
        print_colored(f"Error importing PDF analyzer module: {e}", "red")
        print("Make sure you're running this script from the report_analysis directory.")
        return False
    
    print_section("PDF Analyzer Test")
    
    # Find a suitable test PDF
    if not pdf_path:
        # Look for a PDF in the current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        for file in os.listdir(current_dir):
            if file.endswith(".pdf"):
                pdf_path = os.path.join(current_dir, file)
                print_colored(f"Found test PDF: {pdf_path}", "green")
                break
        
        if not pdf_path:
            print_colored("No PDF file found in the current directory!", "red")
            print("Please specify a PDF file with --pdf parameter.")
            return False
    
    # Set default output path if not provided
    if not output_path:
        output_path = "test_analysis_result.json"
    
    # Create the analyzer
    analyzer = QuestionnaireAnalyzer(debug=True)
    
    print_colored("\nAnalyzing PDF...", "cyan")
    results = analyzer.analyze_pdf(pdf_path)
    
    if "error" in results:
        print_colored(f"Error analyzing PDF: {results['error']}", "red")
        return False
    
    print_colored("\nAnalysis Results:", "green")
    print_json(results)
    
    # Save results to file
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    
    print_colored(f"\nResults saved to: {output_path}", "green")
    
    # Generate emotion report
    try:
        print_colored("\nGenerating emotion report...", "cyan")
        emotion_report = analyzer.generate_emotion_report(results)
        
        print_colored("\nEmotion Report:", "green")
        print_json(emotion_report)
        
        # Save complete health data
        health_data_path = "test_health_data.json"
        analyzer.save_to_healthdata_format(
            results,
            emotion_report,
            health_data_path,
            user_id="test_user"
        )
        
        print_colored(f"\nComplete health data saved to: {health_data_path}", "green")
        
    except Exception as e:
        print_colored(f"Error generating emotion report: {e}", "yellow")
        print("This is not critical for basic PDF analysis.")
    
    return True

def check_environment():
    """Check if the environment is properly set up."""
    print_section("Environment Check")
    
    # Check if setup script exists
    setup_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "setup_pdf_analyzer.py")
    if os.path.exists(setup_script):
        print_colored("Found setup script. You can run it to verify your environment:", "green")
        print(f"  python {os.path.basename(setup_script)}")
    else:
        print_colored("Setup script not found.", "yellow")
    
    # Check OCR module
    try:
        from ocr import ocr_pdf_to_text
        print_colored("OCR module loaded successfully.", "green")
    except ImportError as e:
        print_colored(f"Error importing OCR module: {e}", "red")
        print("Make sure ocr.py is in the current directory.")
        return False
    
    # Check analyzer module
    try:
        from pdf_questionnaire_analyzer import QuestionnaireAnalyzer
        print_colored("PDF analyzer module loaded successfully.", "green")
    except ImportError as e:
        print_colored(f"Error importing PDF analyzer module: {e}", "red")
        print("Make sure pdf_questionnaire_analyzer.py is in the current directory.")
        return False
    
    return True

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Test the PDF Questionnaire Analyzer")
    parser.add_argument("--pdf", help="Path to a test PDF file")
    parser.add_argument("--output", help="Path to save the analysis results")
    parser.add_argument("--environment-only", action="store_true", help="Only check the environment, don't analyze any PDF")
    args = parser.parse_args()
    
    # Check environment
    env_ok = check_environment()
    if not env_ok:
        print_colored("\nEnvironment check failed. Please fix the issues before continuing.", "red")
        return 1
    
    # Exit if only environment check was requested
    if args.environment_only:
        print_colored("\nEnvironment check completed successfully.", "green")
        return 0
    
    # Test PDF analyzer
    result = test_pdf_analyzer(args.pdf, args.output)
    
    if result:
        print_section("Test Completed Successfully")
        print("The PDF analyzer is working correctly. You can use it to analyze PDF health reports.")
        return 0
    else:
        print_section("Test Failed")
        print("The PDF analyzer encountered errors. Please check the messages above.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 