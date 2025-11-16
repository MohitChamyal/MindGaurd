# MindGuard

A comprehensive mental health support application with exercise tracking capabilities.

## Overview

MindGuard is an AI-powered mental health support application that provides:

- Conversational mental health support
- Mood and mental health tracking
- Exercise analysis and fitness tracking

## Installation

### Prerequisites

- Python 3.8-3.10 recommended (MediaPipe works best with these versions)
- For Windows users: Microsoft Visual C++ redistributable may be required

### Quick Install

Use our automated installation script:

```bash
python install_dependencies.py
```

This script will:
1. Install all required dependencies
2. Install the correct version of MediaPipe for your system
3. Verify that everything is working correctly

### Manual Installation

If you prefer manual installation:

1. Install base requirements:
   ```bash
   pip install -r requirements.txt
   ```

2. Install MediaPipe separately (important to match your Python version):
   ```bash
   pip uninstall -y mediapipe
   pip install mediapipe==0.10.13 --no-cache-dir
   ```

## Troubleshooting MediaPipe Issues

If you encounter MediaPipe errors like `Could not initialize bindings DLL...`:

### For Windows Users:

1. Make sure you have the Microsoft Visual C++ redistributable installed:
   - Download from: https://aka.ms/vs/17/release/vc_redist.x64.exe

2. Try using Python 3.8-3.10, which has better compatibility with MediaPipe

3. If you're on Python 3.12 or newer, some features may not work:
   ```bash
   # Install a specific Python version (Windows example)
   winget install Python.Python.3.10
   ```

### For All Users:

1. Try reinstalling MediaPipe:
   ```bash
   pip uninstall -y mediapipe
   pip install mediapipe==0.10.13
   ```

2. If problems persist, the exercise module may be unavailable, but the mental health support features will still work.

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   python server.js
   ```

2. Start the agent:
   ```bash
   cd agent
   python main.py
   ```

3. Start the frontend (in a separate terminal):
   ```bash
   cd frontend
   npm run dev
   ```

## Environment Configuration

Create a `.env` file in the agent directory with your API keys:

```
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here
GROQ_API_KEY=your_groq_key_here
```

At least one of these services is required for full functionality.

## Features

- **Mental Health Assistant**: AI-powered conversations for mental health support
- **Mood Tracking**: Track emotional states and patterns over time  
- **Exercise Analysis**: Analyze form and count repetitions for exercises (push-ups, squats, planks)

## Development

The application consists of three main components:

- **Frontend**: Next.js web interface
- **Backend**: Node.js API server
- **Agent**: Python-based AI agent for mental health support and exercise tracking

## License

[MIT License](LICENSE)

## Debugging Authentication Issues

If you're experiencing login issues with any account type, you can use the debug authentication script to troubleshoot:

```bash
# For regular users
npm run debug-auth user user@example.com [optional-password-to-test]

# For doctors
npm run debug-auth doctor doctor@example.com [optional-password-to-test]

# For admins
npm run debug-auth admin admin@example.com [optional-password-to-test]
```

This script will:
- Check if the user/doctor/admin exists in the database
- Verify if the password is properly hashed
- Test a provided password if supplied
- Provide troubleshooting tips specific to the account type

Example output:
```
✅ User found in database
📋 Account details:
   ID: 60d5f8b0e6b3f40015c9a1a2
   Username: testuser
   Email: user@example.com

🔍 Analyzing password storage:
✅ Password is properly hashed with bcrypt
   Hash format is correct

💡 Login issue troubleshooting:
1. Make sure the user login form is sending to the correct endpoint
2. Check for CORS issues in browser console
3. Ensure passwords are being compared correctly (hashed vs. plain)
4. Verify JWT token generation is working properly
5. Check that localStorage is properly storing the token

📌 API Endpoint: POST http://localhost:5000/api/auth/login
``` 