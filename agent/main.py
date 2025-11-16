import os
import uuid
import logging
from typing import Dict, Optional, List
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mindguard_api")

# Try to import agent workflow with error handling
try:
    from agent.workflow import MentalHealthAgent
    AGENT_AVAILABLE = True
except ImportError as e:
    logger.error(f"Failed to import MentalHealthAgent: {e}")
    AGENT_AVAILABLE = False
except Exception as e:
    logger.error(f"Unexpected error initializing agent components: {e}")
    AGENT_AVAILABLE = False

# Load environment variables
from dotenv import load_dotenv
load_dotenv()  # Loads API keys from .env file

app = FastAPI(title="MindGuard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store chat instances for different users
chat_instances: Dict[str, 'MentalHealthChat'] = {}

RESPONSE_GUIDELINES = {
    "max_words": 50,
    "style": "friendly and supportive",
    "format": "short, clear sentences",
    "tone": "positive and encouraging"
}

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    user_id: str
    provider: str
    emotional_state: Optional[dict] = None
    error: Optional[str] = None

class HealthQuestionnaire(BaseModel):
    user_id: str
    mood: int  # 1-10 scale
    anxiety: str  # none, mild, moderate, severe
    sleep_quality: int  # 1-10 scale
    self_care: str  # yes/no
    stress_factors: str  # free text

class HealthData(BaseModel):
    insights: Dict
    progress: Dict
    recommendations: List[Dict]
    error: Optional[str] = None

class MentalHealthChat:
    def __init__(self, user_id=None):
        """
        Initialize the mental health chat agent with robust error handling.
        
        Args:
            user_id: Optional unique user identifier
        """
        # Initialize logger
        self.logger = logging.getLogger("mental_health_chat")
        
        # Check if agent module is available
        if not AGENT_AVAILABLE:
            self.logger.error("MentalHealthAgent module is not available. Using fallback mode.")
            self.provider = "fallback"
            self.provider_name = "Offline Mode (Limited)"
            self.agent = None
            self.user_id = user_id or self._get_or_create_user_id()
            return
            
        # Initialize or use provided user_id for persistent personalization
        self.user_id = user_id or self._get_or_create_user_id()
        
        # Determine which provider to use based on available API keys
        self.provider = self._determine_provider()
        self.backup_providers = self._get_backup_providers()
        
        # Try to initialize with the primary provider
        try:
            self.agent = MentalHealthAgent(provider=self.provider, user_id=self.user_id)
            self.provider_name = self.provider.capitalize() if self.provider else "Auto-detected"
            self.logger.info(f"Successfully initialized with provider: {self.provider_name}")
        except Exception as e:
            self.logger.error(f"Could not initialize with {self.provider}: {e}")
            # Try fallback providers if available
            success = False
            for backup in self.backup_providers:
                try:
                    self.logger.info(f"Falling back to {backup.capitalize()}...")
                    self.provider = backup
                    self.agent = MentalHealthAgent(provider=self.provider, user_id=self.user_id)
                    self.provider_name = backup.capitalize()
                    success = True
                    self.logger.info(f"Successfully initialized with fallback provider: {self.provider_name}")
                    break
                except Exception as e2:
                    self.logger.error(f"Could not initialize with {backup}: {e2}")
            
            if not success:
                self.logger.warning("All providers failed. Using emergency offline mode.")
                try:
                    # Set environment variables for offline mode
                    os.environ["OFFLINE_MODE"] = "true"
                    # Try one more time with no specific provider (will use offline alternatives)
                    self.provider = None
                    self.agent = MentalHealthAgent(provider=None, user_id=self.user_id)
                    self.provider_name = "Offline Mode"
                    self.logger.info("Successfully initialized offline mode")
                except Exception as e3:
                    self.logger.error(f"Emergency offline mode also failed: {e3}")
                    # Set agent to None for complete fallback mode
                    self.agent = None
                    self.provider_name = "Emergency Fallback"
                
    def _get_or_create_user_id(self):
        """Get existing user ID or create a new one for persistent personalization."""
        # Check if user ID is stored in a file
        user_id_file = ".user_id"
        if os.path.exists(user_id_file):
            try:
                with open(user_id_file, 'r') as f:
                    user_id = f.read().strip()
                    if user_id:
                        return user_id
            except Exception as e:
                self.logger.error(f"Error reading user ID file: {e}")
        
        # Create new user ID if none exists
        user_id = str(uuid.uuid4())
        try:
            os.makedirs("user_data", exist_ok=True)
            with open(user_id_file, 'w') as f:
                f.write(user_id)
        except Exception as e:
            self.logger.error(f"Could not save user ID: {e}")
            
        return user_id

    def _determine_provider(self):
        """Determine the best available LLM provider based on API keys."""
        # Set priority order: OpenAI, Groq, Gemini
        if os.environ.get("OPENAI_API_KEY"):
            return "openai"
        elif os.environ.get("GROQ_API_KEY"):
            return "groq"
        elif os.environ.get("GOOGLE_API_KEY"):
            # Check if the GEMINI_API_VERSION is set, and if not, set a default
            if not os.environ.get("GEMINI_API_VERSION"):
                os.environ["GEMINI_API_VERSION"] = "v1"  # Use v1 instead of v1beta
                os.environ["GEMINI_MODEL_NAME"] = "gemini-1.5-pro"  # Updated model name
            return "gemini"
        else:
            self.logger.warning("No API keys found. The application may not work correctly.")
            return None
    
    def _get_backup_providers(self):
        """Get list of available backup providers."""
        backups = []
        # Don't include the primary provider in backups
        if self.provider != "groq" and os.environ.get("GROQ_API_KEY"):
            backups.append("groq")
        if self.provider != "openai" and os.environ.get("OPENAI_API_KEY"):
            backups.append("openai")
        if self.provider != "gemini" and os.environ.get("GOOGLE_API_KEY"):
            backups.append("gemini")
        return backups

    async def get_response(self, message: str) -> Dict:
        """
        Get a response from the mental health agent with robust error handling.
        
        Args:
            message: User message to respond to
            
        Returns:
            Dict containing response text and metadata
        """
        # Check if agent is available (could be None in complete fallback mode)
        if self.agent is None:
            self.logger.warning("Agent not available, using hardcoded fallback response")
            return {
                "response": "I'm here to help with mental health concerns. However, I'm currently experiencing technical difficulties. Please try again later or contact support if the issue persists.",
                "provider": self.provider_name,
                "error": "Agent initialization failed"
            }
            
        # Process the user message
        try:
            # Sanitize and validate input
            if not message or not isinstance(message, str):
                raise ValueError("Invalid input: message must be a non-empty string")
                
            # Format input for the agent workflow
            result = self.agent.workflow.invoke({
                "user_input": f"{message} and give me answer in a short paragraph, If this prompt is not related to mental health, so please don't give me answer to the asked question and give response as Please ask the question related to mental health",
                "history": [],
                "response": "",
                "needs_escalation": False,
                "emotional_state": {
                    "emotion": "neutral",
                    "confidence": 0.5,
                    "valence": 0.0,
                    "is_crisis": False,
                    "intensity": 0.1
                },
                "therapeutic_recommendations": None,
                "mood_insights": None,
                "gamification_update": None,
                "response_guidelines": RESPONSE_GUIDELINES
            })

            # Extract and format the response
            response = result.get("response", "I'm here to listen. Could you tell me more about that?")
            
            self.logger.info(f"Generated response with provider: {self.provider_name}")
            
            return {
                "response": response,
                "emotional_state": result.get("emotional_state"),
                "provider": self.provider_name
            }
        except Exception as e:
            self.logger.error(f"Error generating response with {self.provider_name}: {e}")
            
            # Try backup providers if available
            for backup in self._get_backup_providers():
                try:
                    self.logger.info(f"Trying backup provider {backup} for response generation")
                    self.provider = backup
                    self.agent = MentalHealthAgent(provider=self.provider, user_id=self.user_id)
                    self.provider_name = backup.capitalize()
                    
                    # Recursive call with the new provider
                    return await self.get_response(message)
                except Exception as e2:
                    self.logger.error(f"Backup provider {backup} also failed: {e2}")
            
            # All providers failed, return a graceful error response
            return {
                "response": "I apologize, but I'm having trouble processing your request right now. Could you try again in a moment?",
                "emotional_state": {
                    "emotion": "neutral",
                    "confidence": 0.5,
                    "valence": 0.0,
                    "is_crisis": False,
                    "intensity": 0.1
                },
                "provider": f"{self.provider_name} (Error Recovery)",
                "error": str(e)
            }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat request and get a response from the mental health agent.
    
    Args:
        request: ChatRequest containing message and optional user_id
        
    Returns:
        ChatResponse containing the agent's response and metadata
    """
    try:
        # Use provided or generate user ID
        user_id = request.user_id or str(uuid.uuid4())
        
        # Validate input
        if not request.message or not isinstance(request.message, str):
            raise HTTPException(
                status_code=400, 
                detail="Invalid message: message must be a non-empty string"
            )
        
        # Create or get existing chat instance
        if user_id not in chat_instances:
            logger.info(f"Creating new chat instance for user: {user_id}")
            chat_instances[user_id] = MentalHealthChat(user_id=user_id)
        
        chat_instance = chat_instances[user_id]
        
        # Get response from the chat instance
        result = await chat_instance.get_response(request.message)
        
        # Check if there was an error
        if "error" in result and result["error"]:
            logger.warning(f"Error in chat response: {result['error']}")
        
        return ChatResponse(
            response=result["response"],
            user_id=chat_instance.user_id,
            provider=result["provider"],
            emotional_state=result.get("emotional_state"),
            error=result.get("error")
        )
    except Exception as e:
        logger.error(f"Unhandled exception in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

def analyze_mental_health(data: Dict, history: Optional[Dict] = None) -> Dict:
    """
    Analyze mental health data and generate insights.
    
    Args:
        data: Health questionnaire data
        history: Optional historical data for trend analysis
        
    Returns:
        Dictionary of insights
    """
    try:
        insights = {
            "mainInsight": "",
            "riskAnalysis": {"low": 0, "moderate": 0, "high": 0},
            "anxietyTrend": {"status": "stable", "percentage": 0, "detail": ""},
            "stressResponse": {"status": "stable", "percentage": 0, "detail": ""},
            "moodStability": {"status": "stable", "detail": ""},
            "patterns": []
        }

        # Analyze mood and sleep correlation
        if data["mood"] < 5 and data["sleep_quality"] < 5:
            insights["patterns"].append("Sleep quality affects mood")
            insights["mainInsight"] = "Your sleep quality seems to be affecting your mood. Consider establishing a consistent sleep routine."

        # Analyze anxiety levels
        anxiety_levels = {"none": 0, "mild": 2, "moderate": 5, "severe": 8}
        anxiety_score = anxiety_levels.get(data["anxiety"], 0)
        
        if anxiety_score > 5:
            insights["riskAnalysis"]["high"] = 60
            insights["riskAnalysis"]["moderate"] = 30
            insights["riskAnalysis"]["low"] = 10
            insights["anxietyTrend"]["status"] = "increasing"
            insights["anxietyTrend"]["detail"] = "High anxiety levels detected. Consider relaxation techniques or professional support."
        else:
            insights["riskAnalysis"]["high"] = 10
            insights["riskAnalysis"]["moderate"] = 30
            insights["riskAnalysis"]["low"] = 60
            insights["anxietyTrend"]["status"] = "decreasing"
            insights["anxietyTrend"]["detail"] = "Your anxiety levels are manageable. Keep practicing your coping strategies."

        # Analyze stress factors
        stress_keywords = ["work", "job", "deadline", "pressure", "overwhelm"]
        if any(keyword in data["stress_factors"].lower() for keyword in stress_keywords):
            insights["stressResponse"]["status"] = "worsening"
            insights["stressResponse"]["detail"] = "Work-related stress detected. Consider time management and boundary-setting techniques."
            
        return insights
    except Exception as e:
        logger.error(f"Error analyzing mental health data: {e}")
        # Return minimal insights in case of error
        return {
            "mainInsight": "Unable to generate detailed insights at this time.",
            "riskAnalysis": {"low": 33, "moderate": 33, "high": 33},
            "anxietyTrend": {"status": "unknown", "percentage": 0, "detail": ""},
            "stressResponse": {"status": "unknown", "percentage": 0, "detail": ""},
            "moodStability": {"status": "unknown", "detail": ""},
            "patterns": []
        }

def generate_mood_data(data: Dict, history: Optional[Dict] = None) -> List[Dict]:
    """Generate mood tracking data with error handling."""
    try:
        return [
            {"date": "2023-04-01", "value": 6},
            {"date": "2023-04-02", "value": data["mood"]}
        ]
    except Exception as e:
        logger.error(f"Error generating mood data: {e}")
        return [{"date": "2023-04-02", "value": 5}]  # Default fallback

def generate_sleep_data(data: Dict, history: Optional[Dict] = None) -> List[Dict]:
    """Generate sleep quality data with error handling."""
    try:
        return [
            {"date": "2023-04-01", "value": 5},
            {"date": "2023-04-02", "value": data["sleep_quality"]}
        ]
    except Exception as e:
        logger.error(f"Error generating sleep data: {e}")
        return [{"date": "2023-04-02", "value": 5}]  # Default fallback

def generate_activity_data(data: Dict, history: Optional[Dict] = None) -> List[Dict]:
    """Generate activity tracking data with error handling."""
    try:
        return [
            {"date": "2023-04-01", "activity": "exercise", "minutes": 30},
            {"date": "2023-04-02", "activity": "meditation", "minutes": 15}
        ]
    except Exception as e:
        logger.error(f"Error generating activity data: {e}")
        return [{"date": "2023-04-02", "activity": "rest", "minutes": 0}]  # Default fallback

def calculate_change(current: float, history: Optional[Dict] = None) -> float:
    """Calculate change between current and historical values with error handling."""
    try:
        if history and "previous" in history:
            return ((current - history["previous"]) / history["previous"]) * 100
        return 0.0
    except (TypeError, ZeroDivisionError, KeyError) as e:
        logger.error(f"Error calculating change: {e}")
        return 0.0

def calculate_anxiety_change(current: str, history: Optional[Dict] = None) -> float:
    """Calculate anxiety level change with error handling."""
    try:
        anxiety_levels = {"none": 0, "mild": 2, "moderate": 5, "severe": 8}
        current_score = anxiety_levels.get(current, 0)
        
        if history and "previous_anxiety" in history:
            previous_score = anxiety_levels.get(history["previous_anxiety"], 0)
            if previous_score == 0:  # Avoid division by zero
                return 0.0 if current_score == 0 else 100.0
            return ((current_score - previous_score) / previous_score) * 100
        return 0.0
    except Exception as e:
        logger.error(f"Error calculating anxiety change: {e}")
        return 0.0

def calculate_stress_change(current: str, history: Optional[Dict] = None) -> float:
    """Calculate stress level change with error handling."""
    try:
        # Simple implementation - could be enhanced with NLP for better accuracy
        return 0.0
    except Exception as e:
        logger.error(f"Error calculating stress change: {e}")
        return 0.0

def generate_article_recommendations(insights: Dict) -> List[Dict]:
    """Generate article recommendations based on insights with error handling."""
    try:
        recommendations = []
        
        if "anxietyTrend" in insights and insights["anxietyTrend"]["status"] == "increasing":
            recommendations.append({
                "title": "Managing Anxiety: Practical Techniques",
                "url": "https://example.com/anxiety-management",
                "summary": "Learn evidence-based techniques to manage anxiety in daily life."
            })
            
        if "patterns" in insights and "Sleep quality affects mood" in insights["patterns"]:
            recommendations.append({
                "title": "Sleep Hygiene: Improving Your Sleep Quality",
                "url": "https://example.com/sleep-hygiene",
                "summary": "Discover how to improve your sleep habits for better mental health."
            })
            
        return recommendations
    except Exception as e:
        logger.error(f"Error generating article recommendations: {e}")
        return [{
            "title": "Mental Health Resources",
            "url": "https://example.com/resources",
            "summary": "General mental health resources and information."
        }]

def generate_video_recommendations(insights: Dict) -> List[Dict]:
    """Generate video recommendations based on insights with error handling."""
    try:
        recommendations = []
        
        if "stressResponse" in insights and insights["stressResponse"]["status"] == "worsening":
            recommendations.append({
                "title": "5-Minute Stress Relief Meditation",
                "url": "https://example.com/stress-meditation-video",
                "thumbnail": "https://example.com/thumbnails/meditation.jpg"
            })
            
        return recommendations
    except Exception as e:
        logger.error(f"Error generating video recommendations: {e}")
        return [{
            "title": "Introduction to Mindfulness",
            "url": "https://example.com/mindfulness-intro",
            "thumbnail": "https://example.com/thumbnails/mindfulness.jpg"
        }]

@app.post("/health-tracking", response_model=HealthData)
async def process_health_data(questionnaire: HealthQuestionnaire):
    """
    Process health questionnaire data and generate insights/recommendations.
    
    Args:
        questionnaire: HealthQuestionnaire with user health data
        
    Returns:
        HealthData containing insights, progress tracking, and recommendations
    """
    try:
        # Validate input data
        if questionnaire.mood < 1 or questionnaire.mood > 10:
            raise HTTPException(status_code=400, detail="Mood must be between 1 and 10")
            
        if questionnaire.sleep_quality < 1 or questionnaire.sleep_quality > 10:
            raise HTTPException(status_code=400, detail="Sleep quality must be between 1 and 10")
            
        # Analyze the health data
        insights = analyze_mental_health(questionnaire.dict())
        
        # Generate progress data
        progress = {
            "moodData": generate_mood_data(questionnaire.dict()),
            "sleepData": generate_sleep_data(questionnaire.dict()),
            "activityData": generate_activity_data(questionnaire.dict()),
            "summary": {
                "mood": {"change": calculate_change(questionnaire.mood)},
                "anxiety": {"change": calculate_anxiety_change(questionnaire.anxiety)},
                "stress": {"change": calculate_stress_change(questionnaire.stress_factors)},
                "sleep": {
                    "durationChange": calculate_change(questionnaire.sleep_quality),
                    "qualityChange": calculate_change(questionnaire.sleep_quality)
                },
                "activities": {
                    "exerciseChange": 0,
                    "meditationChange": 0,
                    "socialChange": 0
                }
            }
        }
        
        # Generate recommendations
        article_recommendations = generate_article_recommendations(insights)
        video_recommendations = generate_video_recommendations(insights)
        all_recommendations = article_recommendations + video_recommendations
        
        # Store the health data (in a real app, this would go to a database)
        user_id = questionnaire.user_id
        logger.info(f"Processed health data for user {user_id}")
        
        return HealthData(
            insights=insights,
            progress=progress,
            recommendations=all_recommendations,
            error=None
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error processing health data: {e}")
        # Return a graceful error response
        return HealthData(
            insights={"mainInsight": "Error processing health data"},
            progress={"error": "Data processing error"},
            recommendations=[{
                "title": "General Mental Health Resources",
                "url": "https://example.com/resources"
            }],
            error=str(e)
        )

@app.get("/health-history/{user_id}")
async def get_health_history(user_id: str):
    """
    Get historical health data for a user.
    
    Args:
        user_id: Unique user identifier
        
    Returns:
        Dictionary of historical health data or error response
    """
    try:
        # In a real application, this would retrieve data from a database
        # This is a placeholder implementation
        logger.info(f"Retrieved health history for user {user_id}")
        
        return {
            "mood_trend": [
                {"date": "2023-04-01", "value": 6},
                {"date": "2023-04-02", "value": 7}
            ],
            "sleep_trend": [
                {"date": "2023-04-01", "value": 5},
                {"date": "2023-04-02", "value": 6}
            ],
            "activity_trend": [
                {"date": "2023-04-01", "activity": "exercise", "minutes": 30},
                {"date": "2023-04-02", "activity": "meditation", "minutes": 15}
            ]
        }
    except Exception as e:
        logger.error(f"Error retrieving health history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve health history: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify API is working.
    
    Returns:
        Status information about API components
    """
    try:
        # Check components status
        provider_status = "unavailable"
        agent_status = "unavailable"
        
        if AGENT_AVAILABLE:
            agent_status = "available"
            # Check if any provider is available
            provider_env_vars = ["OPENAI_API_KEY", "GROQ_API_KEY", "GOOGLE_API_KEY"]
            if any(os.environ.get(var) for var in provider_env_vars):
                provider_status = "available"
                
        return {
            "status": "online",
            "timestamp": int(time.time()),
            "components": {
                "agent": agent_status,
                "provider": provider_status,
                "database": "not_configured"  # Placeholder
            },
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": int(time.time())
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


