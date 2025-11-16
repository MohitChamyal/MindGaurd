# MindGuard System Architecture: Connections & Communication

## Overview of System Components

MindGuard consists of three main components that communicate through different protocols:

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│                 │ ──────────────► │                 │ ──────────────► │                 │
│   Frontend      │                 │    Backend      │                 │     Agent       │
│   (Next.js)     │ ◄────────────── │   (Node.js)     │ ◄────────────── │   (Python)      │
│   Port: 3000    │                 │   Port: 5000    │                 │   Port: 8000    │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
         │                                 │                                    │
         │                                 │                                    │
         ▼                                 ▼                                    ▼
┌─────────────────┐    WebSocket     ┌─────────────────┐    Process Spawn   ┌─────────────────┐
│   Browser       │ ◄──────────────► │   Real-time     │ ◄──────────────► │   Python        │
│   Client        │                  │   Features      │                  │   Scripts       │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
```

## 1. Frontend ↔ Backend Connection

### **Communication Protocol: HTTP/REST API**

#### **Frontend Configuration:**
```typescript
// frontend/lib/config.ts
export const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
```

#### **Backend CORS Configuration:**
```javascript
// backend/server.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
```

#### **API Endpoints Structure:**
```
POST /api/auth/login           - User authentication
POST /api/auth/signup          - User registration
GET  /api/chat/conversations   - Get user conversations
POST /api/chat/conversations   - Create new conversation
POST /api/exercise/upload      - Upload exercise videos
GET  /api/health-tracking      - Get health data
POST /api/health-tracking      - Submit health questionnaire
```

#### **Frontend API Calls Example:**
```typescript
// frontend/services/chatService.ts
export const getConversations = async (userId: string) => {
  const response = await fetch(
    `${apiUrl}/api/chat/conversations/${userId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }
  );
  return await response.json();
};
```

#### **Authentication Flow:**
1. **Frontend** sends login credentials to `/api/auth/login`
2. **Backend** validates credentials against MongoDB
3. **Backend** generates JWT token and returns it
4. **Frontend** stores token in localStorage
5. **Frontend** includes token in `Authorization` header for subsequent requests
6. **Backend** middleware verifies token on protected routes

---

## 2. Backend ↔ Agent Connection

### **Communication Methods:**

#### **Method 1: Direct HTTP Calls (Limited)**
- **Agent URL Configuration:**
```typescript
// frontend/lib/config.ts (defined but not actively used)
export const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8000';
```

#### **Method 2: Process Spawning (Primary Method)**
The backend communicates with the Python agent primarily through **process spawning** rather than HTTP calls.

**Exercise Analysis Connection:**
```javascript
// backend/routes/exercise.js
const analyzeExercise = (exerciseType, videoPath) => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, `../../agent/exercise/standalone/${scriptName}`);
    
    const pythonProcess = spawn(pythonCommand, args);
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Exercise analysis failed`));
      } else {
        resolve({ duration, treasureEarned, output: result });
      }
    });
  });
};
```

**Voice Agent Connection:**
```javascript
// backend/services/voiceAgent.js
async generateEmotionReport(userId, responsesPath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', 'agent', 'emotion_report_generator.py');
    const pythonProcess = spawn('python', [
      pythonScript,
      '--user_id', userId,
      '--responses_file', responsesPath
    ]);
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Emotion report generation failed`));
      } else {
        resolve(outputData);
      }
    });
  });
}
```

#### **Method 3: File-Based Communication**
- **Backend** writes data to JSON files in `agent/user_data/`
- **Agent** reads these files for processing
- **Agent** writes results back to files or database

---

## 3. Agent Internal Architecture

### **Agent Components & Models:**

#### **1. LLM Factory (Multi-Provider Support)**
```python
# agent/agent/llm_factory.py
class LLMFactory:
    @staticmethod
    def create_llm(provider=None, temperature=0.5):
        if provider == "openai":
            return ChatOpenAI(temperature=temperature)
        elif provider == "gemini":
            return ChatGoogleGenerativeAI(temperature=temperature)
        elif provider == "groq":
            return ChatGroq(temperature=temperature)
        else:
            return None  # Offline mode
```

**Supported Providers:**
- **OpenAI GPT**: Primary choice for quality responses
- **Google Gemini**: Multimodal capabilities, good for varied content
- **Groq**: Fast inference, cost-effective
- **Offline Mode**: Fallback when no API keys available

#### **2. Emotion Analysis Model**
```python
# agent/agent/emotion_analysis.py
class EmotionAnalyzer:
    def __init__(self, offline_mode=False, cache_dir="./cached_models"):
        self.model_name = "j-hartmann/emotion-english-distilroberta-base"
        self.classifier = pipeline(
            "text-classification",
            model=self.model_name,
            return_all_scores=True
        )
```

**Model Details:**
- **Framework**: Hugging Face Transformers
- **Model**: DistilRoBERTa (distilled version for efficiency)
- **Emotions Detected**: 27 distinct emotional states
- **Input**: Text conversations
- **Output**: Emotion scores with confidence levels

#### **3. Memory Management System**
```python
# agent/agent/memory.py
class MemoryManager:
    def __init__(self, provider=None):
        self.provider = provider
        self.llm = LLMFactory.create_llm(provider=provider)
        self.vector_store = {}  # In production, use FAISS or similar
```

**Features:**
- **Conversation History**: Stores past interactions
- **Semantic Search**: Finds relevant previous conversations
- **Context Preservation**: Maintains therapeutic relationship
- **Vector Embeddings**: Uses embeddings for similarity matching

#### **4. Mood Tracking System**
```python
# agent/agent/mood_tracking.py
class MoodTracker:
    def __init__(self, user_id):
        self.user_id = user_id
        self.mood_history = []
        self.patterns = {}
```

**Features:**
- **Time Series Analysis**: Tracks mood over time
- **Exponential Moving Average**: Smooths daily fluctuations
- **Pattern Recognition**: Identifies mood triggers
- **Correlation Analysis**: Links mood with activities

#### **5. Therapeutic Modalities**
```python
# agent/agent/therapeutic_modalities.py
class TherapeuticModalities:
    def __init__(self):
        self.techniques = {
            "cbt": "Cognitive Behavioral Therapy",
            "mindfulness": "Mindfulness Meditation",
            "breathing": "Deep Breathing Exercises",
            "progressive_relaxation": "Progressive Muscle Relaxation"
        }
```

**Features:**
- **Technique Library**: Various therapeutic approaches
- **Personalization**: Adapts based on user needs
- **Guided Exercises**: Step-by-step therapeutic activities
- **Progress Tracking**: Monitors technique effectiveness

#### **6. Gamification System**
```python
# agent/engagement/gamification.py
class GamificationSystem:
    def __init__(self, user_id):
        self.user_id = user_id
        self.points = 0
        self.achievements = []
        self.streak = 0
```

**Features:**
- **Points System**: Rewards for engagement
- **Achievement Unlocking**: Milestones and badges
- **Streak Tracking**: Daily consistency rewards
- **Leaderboards**: Comparative progress (privacy-protected)

---

## 4. Database Connections

### **Primary Database: MongoDB**

#### **Backend Connection:**
```javascript
// backend/server.js
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI.replace(/\s+/g, '');
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  });
};
```

#### **Database Models:**
- **User**: Patient authentication and profiles
- **Doctor**: Healthcare provider information
- **Admin**: Administrative users
- **ChatMessage**: Conversation messages
- **Conversation**: Chat threads
- **HealthReport**: Mental health assessments
- **HealthTracking**: Daily health metrics

#### **Connection Flow:**
```
Frontend → Backend API → MongoDB Queries → Backend → Frontend
```

---

## 5. Real-Time Communication

### **WebSocket Implementation:**

#### **Backend WebSocket Server:**
```javascript
// backend/services/websocketService.js
const initializeWebSocket = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });
  
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });
    
    socket.on('send_message', (data) => {
      io.to(data.roomId).emit('receive_message', data);
    });
  });
};
```

#### **Frontend WebSocket Client:**
```typescript
// frontend/hooks/useWebSocket.ts
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling']
});

socket.on('receive_message', (data) => {
  // Handle real-time message updates
});
```

---

## 6. File Storage & Processing

### **File Upload System:**

#### **Exercise Video Processing:**
1. **Frontend** uploads video to `/api/exercise/upload`
2. **Backend** stores video in `uploads/exercises/{type}/`
3. **Backend** spawns Python process to analyze video
4. **Python script** processes video using MediaPipe
5. **Results** returned to backend, then to frontend

#### **Voice Data Processing:**
1. **Frontend** records audio and sends to backend
2. **Backend** uses Google Speech-to-Text API
3. **Transcribed text** processed by voice agent
4. **Results** stored in database and returned

---

## 7. Security & Authentication Flow

### **JWT Token Flow:**
```
1. User Login → Backend validates → JWT issued
2. Frontend stores JWT → Includes in headers
3. Backend verifies JWT → Grants access
4. Token expires → User re-authenticates
```

### **Data Encryption:**
- **Passwords**: bcrypt hashing (12 rounds)
- **Sensitive Data**: AES-256 encryption
- **API Keys**: Environment variables
- **PII Protection**: Microsoft Presidio anonymization

---

## 8. Deployment & Scaling Considerations

### **Current Architecture:**
- **Frontend**: Next.js (SSR/SSG) on Vercel
- **Backend**: Node.js/Express on Railway
- **Agent**: Python/FastAPI (could be on separate service)
- **Database**: MongoDB Atlas (cloud)

### **Communication in Production:**
- **Load Balancers**: Distribute requests across instances
- **API Gateways**: Centralized request routing
- **Message Queues**: Async processing for heavy tasks
- **CDN**: Static asset delivery

### **Scaling Strategies:**
- **Horizontal Scaling**: Multiple backend instances
- **Microservices**: Split agent into separate services
- **Caching**: Redis for session and API response caching
- **Database Sharding**: Distribute data across multiple MongoDB instances

---

## Summary

The MindGuard system uses a **hybrid communication architecture**:

1. **HTTP/REST**: Primary communication between frontend and backend
2. **Process Spawning**: Backend to Python agent for heavy computations
3. **WebSocket**: Real-time features and live chat
4. **File-based**: Data exchange between Node.js and Python components
5. **Database**: MongoDB for persistent data storage

This architecture provides:
- **Flexibility**: Multiple communication methods for different use cases
- **Performance**: Optimized for real-time AI processing
- **Scalability**: Microservices approach allows independent scaling
- **Reliability**: Fallback mechanisms and error handling
- **Security**: JWT authentication and data encryption throughout

The system successfully integrates web technologies (Next.js, Node.js) with AI/ML components (Python, Transformers) through careful API design and process management.</content>
<parameter name="filePath">/Users/Raja-Digvijay-Singh/Downloads/MindGuard/MINDGUARD_SYSTEM_CONNECTIONS.md
