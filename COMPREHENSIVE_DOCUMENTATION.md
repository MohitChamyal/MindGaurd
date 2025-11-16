# MindGuard: Comprehensive AI-Powered Mental Health & Fitness Platform

## 🎯 Project Overview

**MindGuard** is a cutting-edge, AI-powered mental health and fitness tracking platform that combines conversational AI therapy, comprehensive mood tracking, and computer vision-based exercise analysis. The platform provides users with personalized mental health support, therapeutic interventions, and fitness monitoring through advanced machine learning technologies.

## 🌟 Key Features

### 1. **AI-Powered Mental Health Support**
- **Conversational Therapy Agent**: Advanced AI chatbot using LangChain framework with multiple LLM providers (OpenAI, Google Gemini, Groq)
- **Multi-Provider Fallback System**: Robust system with automatic provider switching for maximum uptime
- **Personalized Therapeutic Interventions**: Context-aware responses based on user's emotional state and history
- **Crisis Detection & Safety Protocols**: Automatic detection of mental health crises with escalation procedures
- **Evidence-Based Therapeutic Modalities**: Integration of CBT, DBT, and mindfulness techniques

### 2. **Advanced Mood & Mental Health Tracking**
- **Real-Time Emotion Analysis**: Using transformer-based models for emotion recognition from text
- **Comprehensive Mood Tracking**: Daily mood monitoring with valence and intensity measurements
- **Pattern Recognition**: Advanced analytics to identify emotional patterns and triggers
- **Personalized Insights**: AI-generated insights based on mood trends and behavioral data
- **Risk Assessment**: Automated risk factor identification for mental health concerns

### 3. **Computer Vision Exercise Analysis**
- **MediaPipe Integration**: Real-time pose estimation and movement analysis
- **Exercise Recognition**: Support for multiple exercise types (push-ups, squats, planks, bicep curls, walking)
- **Form Analysis**: AI-powered assessment of exercise form and technique
- **Repetition Counting**: Automatic counting of exercise repetitions using pose landmarks
- **Progress Tracking**: Comprehensive fitness progress monitoring with wellness scoring

### 4. **User Management & Gamification**
- **Multi-Role System**: Support for regular users, healthcare professionals, and administrators
- **Gamification Engine**: Points, achievements, and progress tracking to enhance user engagement
- **Progress Visualization**: Interactive charts and dashboards for mood and fitness data
- **Personalized Recommendations**: AI-driven suggestions for activities, exercises, and therapeutic interventions

### 5. **Health Analytics & Reporting**
- **Comprehensive Health Reports**: Detailed analysis of mental health questionnaires
- **Professional Healthcare Integration**: Features for healthcare provider access and patient monitoring
- **Data Visualization**: Interactive charts for mood trends, anxiety levels, and exercise progress
- **Export Capabilities**: PDF report generation for clinical use

## 🛠 Technical Architecture

### **System Architecture**
MindGuard follows a modern microservices architecture with three main components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │◄──►│    Backend      │◄──►│   AI Agent      │
│   (Next.js)     │    │   (Node.js)     │    │   (Python)      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │    MongoDB      │    │  File Storage   │
│     Client      │    │   Database      │    │   & Models      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 💻 Technology Stack

### **Frontend**
- **Framework**: Next.js 13.5.8 (React 18.3.1)
- **Language**: TypeScript 5.2.2
- **Styling**: Tailwind CSS 3.3.3
- **UI Components**: Radix UI component library
- **Charts & Visualization**: Recharts 2.15.1
- **Forms**: React Hook Form 7.53.0 with Zod validation
- **State Management**: React hooks and context
- **PWA Support**: Next-PWA for progressive web app capabilities
- **Authentication**: JWT-based authentication
- **HTTP Client**: Axios 1.8.1

### **Backend**
- **Runtime**: Node.js with Express.js 4.21.2
- **Language**: JavaScript (ES6+)
- **Database**: MongoDB with Mongoose 7.8.6 ODM
- **Authentication**: JSON Web Tokens (JWT) with bcryptjs hashing
- **File Upload**: Multer 1.4.5 for video file handling
- **API Validation**: Express-validator 7.0.1
- **CORS**: CORS 2.8.5 for cross-origin resource sharing
- **WebSocket**: WS 8.18.1 for real-time communication
- **PDF Generation**: PDFKit 0.17.0 for report generation

### **AI Agent (Python)**
- **Framework**: FastAPI 0.116.1 with Uvicorn 0.35.0
- **Language**: Python 3.8-3.13 (3.13+ recommended)
- **AI/ML Libraries**:
  - **LangChain** 0.3.27: LLM orchestration and chain management
  - **LangGraph** 0.6.5: State graph workflow management
  - **Transformers** 4.55.2: Hugging Face models for emotion analysis
  - **PyTorch** 2.8.0: Deep learning framework
  - **FAISS-CPU** 1.12.0: Vector similarity search
  - **Google GenerativeAI** 0.8.5: Gemini API integration
  - **OpenAI** 1.99.9: GPT models integration
- **Computer Vision**:
  - **OpenCV** 4.8.0+: Image and video processing
  - **MediaPipe** 0.10.13: Real-time pose estimation
- **Data Processing**:
  - **NumPy** 2.3.2: Numerical computations
  - **Pandas**: Data manipulation (optional)
  - **Matplotlib** 3.10.5: Data visualization
- **Privacy & Security**:
  - **Presidio Analyzer/Anonymizer** 2.2.0: PII detection and anonymization
  - **SpaCy** 3.8.7: Natural language processing

### **Database & Storage**
- **Primary Database**: MongoDB (Cloud Atlas)
- **File Storage**: Local filesystem with organized directory structure
- **Data Models**: Comprehensive schemas for users, health reports, mood data, exercise analytics
- **Indexing**: Optimized database indexes for performance

### **Development & Deployment**
- **Package Managers**: npm (Node.js), pip (Python)
- **Environment Management**: Python virtual environments, Node.js modules
- **Configuration**: Environment variables (.env files)
- **Logging**: Structured logging with appropriate log levels
- **Error Handling**: Comprehensive error handling and fallback mechanisms

## 🚀 Core Functionalities

### **1. Mental Health Conversational AI**

**Technology**: LangChain + LangGraph with multiple LLM providers

**Features**:
- Multi-provider LLM support (OpenAI GPT, Google Gemini, Groq)
- Intelligent context management and conversation memory
- Emotion-aware response generation
- Crisis detection with automatic escalation protocols
- Therapeutic intervention recommendations
- Privacy-focused design with PII anonymization

**Workflow**:
1. **Safety Check**: Analyze input for harmful content and crisis indicators
2. **Emotional Assessment**: Determine emotional state using transformer models
3. **Mood Tracking**: Log emotional data for pattern analysis
4. **Therapeutic Recommendations**: Generate evidence-based interventions
5. **Clinical Response**: Provide supportive, therapeutic responses
6. **Gamification Update**: Award points and track engagement
7. **Escalation** (if needed): Connect to crisis resources

### **2. Exercise Analysis & Fitness Tracking**

**Technology**: MediaPipe + OpenCV for computer vision

**Supported Exercises**:
- **Push-ups**: Form analysis, repetition counting, duration tracking
- **Squats**: Depth analysis, posture correction, rep counting
- **Planks**: Duration tracking, posture stability analysis
- **Bicep Curls**: Range of motion analysis, rep counting
- **Walking**: Activity duration and movement analysis

**Analysis Pipeline**:
1. **Video Upload**: Multi-format video file support
2. **Pose Detection**: MediaPipe-based pose landmark extraction
3. **Movement Analysis**: Custom algorithms for exercise-specific analysis
4. **Form Assessment**: AI-powered evaluation of exercise technique
5. **Progress Calculation**: Wellness scoring and improvement tracking
6. **Report Generation**: Detailed analysis reports with recommendations

### **3. Comprehensive Health Tracking**

**Components**:
- **Mood Questionnaires**: Validated mental health assessment tools
- **Emotional State Monitoring**: Real-time emotion tracking from conversations
- **Sleep & Energy Tracking**: Comprehensive wellness metrics
- **Anxiety & Stress Analysis**: Specialized assessment algorithms
- **Risk Factor Identification**: Automated mental health risk assessment
- **Progress Visualization**: Interactive dashboards and trend analysis

### **4. User Experience & Interface**

**Design Philosophy**: Clean, accessible, and therapeutically appropriate UI/UX

**Key Interface Elements**:
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile
- **Dark/Light Mode**: User preference-based theming
- **Accessibility**: WCAG-compliant design with screen reader support
- **Progressive Web App**: Offline capabilities and app-like experience
- **Real-time Updates**: WebSocket-based live data updates
- **Intuitive Navigation**: Clear information architecture for easy use

## 📊 Data Models & Schema

### **User Management**
```javascript
// User Schema
{
  _id: ObjectId,
  username: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  lastActive: Date,
  preferences: {
    theme: String,
    notifications: Boolean,
    privacy: Object
  }
}

// Doctor Schema (Healthcare Providers)
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (hashed),
  specialization: String,
  isVerified: Boolean,
  patients: [ObjectId]
}

// Admin Schema
{
  _id: ObjectId,
  username: String,
  email: String (unique),
  password: String (hashed),
  fullName: String,
  role: String (enum: ['admin', 'super_admin'])
}
```

### **Health & Mental Health Data**
```javascript
// Health Report Schema
{
  _id: ObjectId,
  userId: ObjectId,
  timestamp: Date,
  questionnaireData: {
    mood: Number (1-10),
    anxiety: String (none/mild/moderate/severe),
    sleep_quality: Number (1-10),
    energy_levels: Number (1-10),
    stress_factors: String,
    coping_strategies: String,
    social_support: Number (1-10),
    // ... additional mental health metrics
  },
  emotionReport: {
    summary: {
      emotions_count: Object,
      average_confidence: Number,
      average_valence: Number,
      crisis_count: Number,
      risk_factors: [String]
    },
    disorder_indicators: [String]
  },
  insights: {
    mainInsight: Object,
    riskAnalysis: Object,
    recommendations: [Object]
  }
}
```

### **Exercise & Fitness Data**
```javascript
// Exercise Analysis Schema
{
  _id: ObjectId,
  userId: ObjectId,
  exerciseType: String,
  timestamp: Date,
  videoFilename: String,
  analysisResults: {
    repetitions: Number,
    duration: Number,
    formScore: Number,
    wellnessScore: Number,
    recommendations: [String],
    detectedIssues: [String]
  },
  performanceMetrics: {
    accuracy: Number,
    consistency: Number,
    improvement: Number
  }
}
```

## 🔒 Security & Privacy Features

### **Data Protection**
- **PII Anonymization**: Automatic detection and anonymization of personally identifiable information
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Data Encryption**: Sensitive data encryption at rest and in transit
- **Privacy Controls**: User-controlled privacy settings and data sharing preferences

### **Mental Health Safety**
- **Crisis Detection**: Automated identification of mental health crisis indicators
- **Emergency Protocols**: Immediate access to crisis hotlines and emergency resources
- **Professional Escalation**: Seamless connection to healthcare providers when needed
- **Safe Storage**: Secure, HIPAA-compliant data storage practices

## 🎮 Gamification & Engagement

### **Engagement Systems**
- **Points & Achievements**: Reward system for consistent platform usage
- **Progress Tracking**: Visual progress indicators for mental health and fitness goals
- **Streak Tracking**: Daily engagement streaks to encourage regular use
- **Milestone Celebrations**: Recognition of significant progress achievements
- **Personalized Goals**: AI-generated, achievable goals based on user progress

## 🔧 Installation & Setup

### **Prerequisites**
- **Python** 3.8-3.13 (3.13+ recommended for best performance)
- **Node.js** 16+ with npm
- **MongoDB** (local installation or cloud Atlas)
- **Git** for version control

### **Quick Setup**
```bash
# Clone the repository
git clone <repository-url>
cd MindGuard

# Install Python dependencies
python install_dependencies.py

# Install Node.js dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment variables
# Create .env files in backend/, frontend/, and agent/ directories

# Run the application
npm run dev  # Frontend
npm start    # Backend  
python main.py  # Agent (from agent/ directory)
```

### **Environment Configuration**
Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation  
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `GOOGLE_API_KEY`: Google Gemini API key (optional)
- `GROQ_API_KEY`: Groq API key (optional)

## 🎯 Use Cases & Target Audience

### **Primary Users**
- **Individuals**: People seeking mental health support and fitness tracking
- **Healthcare Providers**: Therapists, counselors, and mental health professionals
- **Fitness Enthusiasts**: Users interested in AI-powered exercise form analysis
- **Wellness Coaches**: Professionals supporting client mental health and fitness

### **Key Use Cases**
1. **Daily Mental Health Check-ins**: Regular mood tracking and emotional support
2. **Exercise Form Improvement**: Computer vision-based fitness coaching
3. **Therapeutic Intervention**: AI-powered mental health support between therapy sessions
4. **Clinical Monitoring**: Healthcare provider tools for patient progress tracking
5. **Wellness Integration**: Holistic approach combining mental health and physical fitness

## 🚀 Future Enhancements

### **Planned Features**
- **Voice Integration**: Speech-to-text for more natural interactions
- **Wearable Integration**: Connection with fitness trackers and smartwatches
- **Telehealth Integration**: Direct connection with licensed therapists
- **Advanced Analytics**: Predictive modeling for mental health outcomes
- **Social Features**: Safe community spaces for peer support
- **Mobile Application**: Native iOS and Android applications
- **Multi-language Support**: Internationalization for global accessibility

### **Technical Improvements**
- **Edge Computing**: On-device AI processing for improved privacy
- **Advanced Computer Vision**: More sophisticated exercise analysis
- **Real-time Processing**: Live video analysis for immediate feedback
- **Integration APIs**: Third-party platform integrations
- **Enhanced Security**: Advanced encryption and privacy controls

## 📈 Performance & Scalability

### **Current Capabilities**
- **Concurrent Users**: Designed to handle hundreds of simultaneous users
- **Video Processing**: Efficient MediaPipe-based analysis with reasonable processing times
- **Database Performance**: Optimized MongoDB queries with proper indexing
- **API Response Times**: Sub-second response times for most operations
- **Reliability**: Robust error handling and fallback mechanisms

### **Scalability Considerations**
- **Horizontal Scaling**: Microservices architecture supports easy scaling
- **Load Balancing**: Can be configured with load balancers for high availability  
- **Database Optimization**: Supports MongoDB sharding for large datasets
- **Caching**: Redis integration planned for improved performance
- **CDN Integration**: Static asset delivery optimization

## 🏥 Healthcare & Clinical Integration

### **Clinical Features**
- **HIPAA Compliance**: Designed with healthcare privacy regulations in mind
- **Professional Dashboard**: Specialized interface for healthcare providers
- **Patient Progress Reports**: Comprehensive clinical reporting tools
- **Risk Assessment**: Automated mental health risk factor identification
- **Crisis Management**: Emergency protocols and professional escalation paths

### **Integration Capabilities**
- **EHR Systems**: Potential integration with electronic health records
- **Telehealth Platforms**: Connection with video therapy platforms
- **Clinical Workflows**: Support for existing healthcare provider workflows
- **Compliance Reporting**: Tools for regulatory compliance and reporting

## 📞 Support & Documentation

### **User Support**
- **Comprehensive Documentation**: Detailed user guides and technical documentation
- **Video Tutorials**: Step-by-step guides for key features
- **FAQ Section**: Common questions and troubleshooting guides
- **Community Support**: User forums and community resources
- **Professional Support**: Technical support for healthcare organizations

### **Developer Resources**
- **API Documentation**: Complete API reference and examples
- **Integration Guides**: Third-party integration documentation
- **Development Setup**: Detailed development environment setup
- **Contributing Guidelines**: Open-source contribution protocols
- **Technical Architecture**: Comprehensive system architecture documentation

---

## 📝 Summary

**MindGuard** represents a comprehensive, AI-powered solution that bridges the gap between mental health support and physical fitness tracking. By combining cutting-edge AI technologies, computer vision, and user-centered design, MindGuard provides a holistic approach to wellness that is both technically sophisticated and therapeutically sound.

The platform's strength lies in its integration of multiple advanced technologies:
- **LangChain/LangGraph** for sophisticated AI conversations
- **MediaPipe** for real-time exercise analysis  
- **Transformer models** for emotion recognition
- **Modern web technologies** for seamless user experience
- **Robust backend architecture** for scalability and reliability

Whether used by individuals for personal wellness, healthcare providers for patient monitoring, or fitness enthusiasts for exercise improvement, MindGuard offers a comprehensive, privacy-focused, and clinically-informed approach to digital wellness.

*MindGuard: Where AI meets wellness, and technology serves human flourishing.*
