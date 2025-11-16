#!/usr/bin/env python3
"""
Setup script for PDF Analyzer
This script checks and configures the environment for PDF analysis, verifies the presence
of required dependencies, and provides guidance for installation if needed.
"""
import os
import sys
import subprocess
import json
from pathlib import Path

def print_header(message):
    """Print a formatted header message"""
    print("\n" + "=" * 80)
    print(f" {message} ".center(80, "="))
    print("=" * 80)

def print_step(message):
    """Print a step message"""
    print(f"\n>> {message}")

def check_python_version():
    """Check if Python version is appropriate"""
    print_step("Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print(f"⚠️ Warning: Python version {version.major}.{version.minor} might be too old.")
        print("   Recommended version is Python 3.7 or higher.")
        return False
    else:
        print(f"✅ Python version {version.major}.{version.minor}.{version.micro} is suitable.")
        return True

def check_pip_packages():
    """Check if required pip packages are installed"""
    print_step("Checking required pip packages...")
    
    # Define required packages
    required_packages = [
        "pytesseract",
        "pdf2image",
        "Pillow",
        "nltk",
        "numpy"
    ]
    
    # Check each package
    missing_packages = []
    for package in required_packages:
        try:
            subprocess.run(
                [sys.executable, "-c", f"import {package}"],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            print(f"✅ Package '{package}' is installed.")
        except subprocess.CalledProcessError:
            print(f"❌ Package '{package}' is missing.")
            missing_packages.append(package)
    
    # Suggest installation for missing packages
    if missing_packages:
        print("\n⚠️ Some required packages are missing. Install them with:")
        print(f"   pip install {' '.join(missing_packages)}")
        print("   or")
        print("   pip install -r requirements.txt")
        return False
    else:
        print("✅ All required Python packages are installed.")
        return True

def check_tesseract():
    """Check if Tesseract OCR is installed and configured"""
    print_step("Checking Tesseract OCR installation...")
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define possible Tesseract paths
    tesseract_paths = [
        os.path.join(current_dir, "Tesseract-OCR", "tesseract.exe"),  # Windows, in the report_analysis folder
        "tesseract",  # In PATH
        "/usr/bin/tesseract",  # Linux
        "/usr/local/bin/tesseract",  # macOS with Homebrew
        "/opt/homebrew/bin/tesseract"  # macOS with Homebrew on Apple Silicon
    ]
    
    # Check each path
    found_tesseract = False
    working_path = None
    
    for path in tesseract_paths:
        try:
            if os.path.isfile(path) or path == "tesseract":
                result = subprocess.run(
                    [path, "--version"],
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                version = result.stdout.split("\n")[0]
                print(f"✅ Tesseract found: {version}")
                print(f"   Path: {path}")
                found_tesseract = True
                working_path = path
                break
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue
    
    # Provide guidance if Tesseract is not found
    if not found_tesseract:
        print("❌ Tesseract OCR not found or not working.")
        print("\nInstallation instructions:")
        print("  - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki")
        print("    and place in the 'Tesseract-OCR' folder in the report_analysis directory")
        print("  - Linux: sudo apt install tesseract-ocr")
        print("  - macOS: brew install tesseract")
        return False, None
    
    return True, working_path

def check_poppler():
    """Check if Poppler is installed and configured"""
    print_step("Checking Poppler installation...")
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define possible Poppler paths
    poppler_paths = [
        os.path.join(current_dir, "poppler-24.08.0", "Library", "bin"),  # Windows, in the report_analysis folder
        os.path.join(os.path.dirname(current_dir), "poppler-24.08.0", "Library", "bin"),  # Windows, in parent folder
        "/usr/bin",  # Linux
        "/usr/local/bin",  # macOS with Homebrew
        "/opt/homebrew/bin"  # macOS with Homebrew on Apple Silicon
    ]
    
    # Check each path
    found_poppler = False
    working_path = None
    
    for path in poppler_paths:
        pdf_to_text = "pdftotext.exe" if sys.platform == "win32" else "pdftotext"
        pdf_to_text_path = os.path.join(path, pdf_to_text) if sys.platform == "win32" else os.path.join(path, "pdftotext")
        
        try:
            if os.path.isfile(pdf_to_text_path):
                # On Windows, we just check if the file exists
                if sys.platform == "win32":
                    print(f"✅ Poppler utilities found at: {path}")
                    found_poppler = True
                    working_path = path
                    break
                else:
                    # On Unix, we can test it
                    result = subprocess.run(
                        [pdf_to_text_path, "-v"],
                        check=True,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True
                    )
                    version = result.stderr.split("\n")[0]
                    print(f"✅ Poppler utilities found: {version}")
                    print(f"   Path: {path}")
                    found_poppler = True
                    working_path = path
                    break
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue
    
    # Provide guidance if Poppler is not found
    if not found_poppler:
        print("❌ Poppler utilities not found or not working.")
        print("\nInstallation instructions:")
        print("  - Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases")
        print("    and place in the 'poppler-24.08.0' folder in the report_analysis directory")
        print("  - Linux: sudo apt install poppler-utils")
        print("  - macOS: brew install poppler")
        return False, None
    
    return True, working_path

def update_config(tesseract_path, poppler_path):
    """Update configuration file with detected paths"""
    print_step("Updating configuration...")
    
    config = {
        "tesseract_path": tesseract_path,
        "poppler_path": poppler_path
    }
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_dir, "pdf_analyzer_config.json")
    
    try:
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)
        print(f"✅ Configuration saved to: {config_path}")
        return True
    except Exception as e:
        print(f"❌ Error saving configuration: {e}")
        return False

def verify_ocr_module():
    """Verify that the OCR module can be imported and used"""
    print_step("Verifying OCR module...")
    
    try:
        # Try importing the OCR module
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from ocr import ocr_pdf_to_text
        print("✅ OCR module imported successfully.")
        
        # Check for test PDF
        current_dir = os.path.dirname(os.path.abspath(__file__))
        test_pdf = os.path.join(current_dir, "mental_health_report.pdf")
        
        if os.path.isfile(test_pdf):
            print(f"✅ Test PDF found: {test_pdf}")
            print("   You can test OCR by running: python ocr.py")
        else:
            print("⚠️ Test PDF not found. OCR can't be verified without a test PDF.")
        
        return True
    except ImportError as e:
        print(f"❌ Error importing OCR module: {e}")
        return False

def main():
    """Main function"""
    print_header("PDF Analyzer Setup")
    
    # Check Python version
    python_ok = check_python_version()
    
    # Check pip packages
    packages_ok = check_pip_packages()
    
    # Check Tesseract
    tesseract_ok, tesseract_path = check_tesseract()
    
    # Check Poppler
    poppler_ok, poppler_path = check_poppler()
    
    # Update configuration
    if tesseract_ok and poppler_ok:
        config_ok = update_config(tesseract_path, poppler_path)
    else:
        config_ok = False
    
    # Verify OCR module
    ocr_ok = verify_ocr_module()
    
    # Print summary
    print_header("Setup Summary")
    print(f"Python: {'✅ OK' if python_ok else '⚠️ Warning'}")
    print(f"Packages: {'✅ OK' if packages_ok else '❌ Missing'}")
    print(f"Tesseract: {'✅ OK' if tesseract_ok else '❌ Not found'}")
    print(f"Poppler: {'✅ OK' if poppler_ok else '❌ Not found'}")
    print(f"Configuration: {'✅ OK' if config_ok else '❌ Not updated'}")
    print(f"OCR Module: {'✅ OK' if ocr_ok else '❌ Not working'}")
    
    # Overall status
    if all([python_ok, packages_ok, tesseract_ok, poppler_ok, config_ok, ocr_ok]):
        print("\n✅ Setup completed successfully. PDF Analyzer is ready to use.")
        return 0
    else:
        print("\n⚠️ Setup completed with warnings or errors. PDF Analyzer may not work correctly.")
        print("   Please resolve the issues above before using the PDF Analyzer.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 