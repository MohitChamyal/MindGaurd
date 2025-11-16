#!/usr/bin/env python3
"""
MindGuard Dependency Installer

This script ensures all required dependencies are properly installed,
with special handling for MediaPipe which can be problematic.
"""

import os
import sys
import subprocess
import platform
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("dependency_installer")

def get_python_version():
    """Get the current Python version as a tuple."""
    return sys.version_info[:3]

def is_compatible_python_version():
    """Check if the current Python version is compatible with our requirements."""
    version = get_python_version()
    # MediaPipe works best with Python 3.8-3.10
    return (3, 8) <= version < (3, 12)

def get_os_info():
    """Get operating system information."""
    system = platform.system().lower()
    if system == 'windows':
        release = platform.release()
        return f"windows_{release}"
    elif system == 'darwin':
        return "macos"
    elif system == 'linux':
        return "linux"
    return "unknown"

def install_requirements():
    """Install main requirements."""
    logger.info("Installing base requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        logger.info("Base requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install base requirements: {e}")
        return False

def install_mediapipe():
    """Install the appropriate MediaPipe version with error handling."""
    python_version = get_python_version()
    os_info = get_os_info()
    
    logger.info(f"Installing MediaPipe for Python {python_version} on {os_info}")
    
    # Determine the appropriate MediaPipe version based on Python version
    if (3, 11) <= python_version < (3, 12):
        mediapipe_version = "0.10.13"  # Latest version for Python 3.11
    elif (3, 10) <= python_version < (3, 11):
        mediapipe_version = "0.10.13"  # Latest version for Python 3.10
    elif (3, 8) <= python_version < (3, 10):
        mediapipe_version = "0.10.13"  # Latest version for Python 3.8-3.9
    elif (3, 12) <= python_version:
        logger.warning("Python 3.12+ detected. MediaPipe may not be fully compatible.")
        mediapipe_version = "0.10.13"  # Try with latest, but warn of potential issues
    else:
        logger.error(f"Unsupported Python version: {python_version}, MediaPipe requires Python 3.8+")
        return False
    
    try:
        # First ensure any old versions are uninstalled
        logger.info("Removing any existing MediaPipe installations...")
        subprocess.call([sys.executable, "-m", "pip", "uninstall", "-y", "mediapipe"])
        
        # Install the specific MediaPipe version
        logger.info(f"Installing MediaPipe {mediapipe_version}...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            f"mediapipe=={mediapipe_version}", "--no-cache-dir"
        ])
        
        logger.info("MediaPipe installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install MediaPipe: {e}")
        
        # Fallback procedure for Windows - may need Visual C++ redistributable
        if os_info.startswith("windows"):
            logger.info("Windows detected. You may need to install Visual C++ redistributable.")
            logger.info("Download link: https://aka.ms/vs/17/release/vc_redist.x64.exe")
        
        return False

def setup_virtual_environment():
    """Set up a virtual environment (optional)."""
    if os.path.exists("venv"):
        logger.info("Virtual environment already exists")
        return True
    
    try:
        logger.info("Creating virtual environment...")
        subprocess.check_call([sys.executable, "-m", "venv", "venv"])
        
        # Determine the path to the virtual environment's Python
        if platform.system().lower() == "windows":
            venv_python = os.path.join("venv", "Scripts", "python.exe")
        else:
            venv_python = os.path.join("venv", "bin", "python")
        
        logger.info(f"Virtual environment created at {os.path.abspath('venv')}")
        logger.info(f"Activate it with: ")
        
        if platform.system().lower() == "windows":
            logger.info("    venv\\Scripts\\activate")
        else:
            logger.info("    source venv/bin/activate")
        
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to create virtual environment: {e}")
        return False

def verify_installation():
    """Verify that dependencies are correctly installed."""
    try:
        # Try importing key libraries
        import_check = subprocess.check_output(
            [sys.executable, "-c", "import mediapipe, cv2, numpy; print('success')"],
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        
        if "success" in import_check:
            logger.info("Verification successful! All key dependencies can be imported.")
            return True
        else:
            logger.warning(f"Verification returned unexpected output: {import_check}")
            return False
    except subprocess.CalledProcessError as e:
        logger.error(f"Verification failed. Import error: {e.output}")
        return False

def main():
    """Main installation process."""
    logger.info("Starting MindGuard dependency installation")
    
    # Check Python version
    if not is_compatible_python_version():
        logger.warning(f"Warning: Python {get_python_version()} may not be fully compatible.")
        logger.warning("Recommended: Python 3.8-3.10 for best compatibility with MediaPipe.")
        
        # Let user decide whether to continue
        if input("Continue anyway? (y/n): ").lower() != 'y':
            logger.info("Installation cancelled by user")
            return

    # Install main requirements
    if not install_requirements():
        logger.error("Failed to install base requirements. Please check for errors above.")
        return
    
    # Install MediaPipe separately with special handling
    if not install_mediapipe():
        logger.warning("MediaPipe installation had issues. Exercise features may not work correctly.")
        logger.info("You can try manual installation: pip install mediapipe==0.10.13")
    
    # Verify installation
    if verify_installation():
        logger.info("Installation completed successfully!")
        logger.info("You can now run the application with: python agent/main.py")
    else:
        logger.warning("Installation verification failed. The application may not work correctly.")
        logger.info("If issues persist, see the troubleshooting guide in the README.md file.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Installation cancelled by user")
    except Exception as e:
        logger.error(f"Unexpected error during installation: {e}")
        sys.exit(1) 