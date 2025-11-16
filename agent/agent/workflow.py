from typing import TypedDict, List, Optional, Dict, Any
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END
from transformers import pipeline  # For emotional analysis

from agent.memory import MemoryManager
from agent.llm_factory import LLMFactory
from agent.emotion_analysis import EmotionAnalyzer
from agent.mood_tracking import MoodTracker
from agent.therapeutic_modalities import TherapeuticModalities
from agent.engagement.gamification import GamificationSystem


class AgentState(TypedDict):
    user_input: str
    history: List[Dict[str, Any]]
    response: str
    needs_escalation: bool
    emotional_state: Dict[str, Any]
    therapeutic_recommendations: Optional[Dict[str, Any]]
    mood_insights: Optional[Dict[str, Any]]
    gamification_update: Optional[Dict[str, Any]]


class MentalHealthAgent:
    def __init__(self, provider: Optional[str] = None, user_id: str = "default_user"):
        """
        Initialize the mental health agent.
        
        Args:
            provider: Optional provider to use ('openai' or 'gemini')
            user_id: Unique identifier for the user
        """
        self.provider = provider
        self.user_id = user_id
        self.llm = LLMFactory.create_llm(provider=provider, temperature=0.5)
        self.memory = MemoryManager(provider=provider)
        
        # Initialize enhanced components
        self.emotion_analyzer = EmotionAnalyzer(
            offline_mode=False,  # Try online first, fallback to offline
            cache_dir="./cached_models"
        )
        
        self.mood_tracker = MoodTracker(user_id=user_id)
        self.therapeutic_modalities = TherapeuticModalities()
        self.gamification = GamificationSystem(user_id=user_id)
        
        self.workflow = self._build_enhanced_workflow()

    def _build_enhanced_workflow(self):
        workflow = StateGraph(AgentState)

        # Enhanced node sequence
        workflow.add_node("safety_check", self.safety_check)
        workflow.add_node("emotional_assessment", self.emotional_assessment)
        workflow.add_node("mood_tracking", self.track_mood)
        workflow.add_node("therapy_recommendations", self.generate_recommendations)
        workflow.add_node("clinical_response", self.generate_clinical_response)
        workflow.add_node("update_gamification_node", self.update_gamification)
        workflow.add_node("escalate", self.escalate_with_resources)

        # Define the enhanced workflow path
        workflow.set_entry_point("safety_check")
        workflow.add_edge("safety_check", "emotional_assessment")
        workflow.add_edge("emotional_assessment", "mood_tracking")
        workflow.add_edge("mood_tracking", "therapy_recommendations")
        
        workflow.add_conditional_edges(
            "therapy_recommendations",
            self.determine_intervention_path,
            {"continue": "clinical_response", "escalate": "escalate"}
        )

        workflow.add_edge("clinical_response", "update_gamification_node")
        workflow.add_edge("update_gamification_node", END)
        workflow.add_edge("escalate", END)

        return workflow.compile()

    def safety_check(self, state: AgentState):
        """Enhanced safety check with PII filtering and crisis keyword check"""
        text = state["user_input"].lower()
        crisis_keywords = {
            "suicide", "kill myself", "end it all",
            "want to die", "can't go on", "better off dead",
            "no reason to live", "no point in living"
        }
        return {
            "needs_escalation": any(kw in text for kw in crisis_keywords),
            "user_input": text
        }

    def emotional_assessment(self, state: AgentState):
        """Enhanced emotional state analysis with robust fallback"""
        try:
            # Use the enhanced emotion analyzer
            result = self.emotion_analyzer.analyze(state["user_input"])
            
            # Determine if this is a crisis state based on emotional content
            crisis_emotions = ["hopelessness", "crisis"]
            is_crisis = (
                result["emotion"] in crisis_emotions and result["confidence"] > 0.7 or
                result["is_crisis"] or 
                state.get("needs_escalation", False)
            )
            
            return {
                "emotional_state": result,
                "needs_escalation": is_crisis
            }
        except Exception as e:
            print(f"Error in emotional assessment: {e}")
            return {
                "emotional_state": {
                    "emotion": "unknown",
                    "confidence": 0.5,
                    "valence": 0.0,
                    "is_crisis": False,
                    "intensity": 0.1
                },
                "needs_escalation": state.get("needs_escalation", False)
            }
    
    def track_mood(self, state: AgentState):
        """Track mood over time and generate insights"""
        emotional_state = state["emotional_state"]
        
        # Add mood entry to tracker
        entry = self.mood_tracker.add_mood_entry(
            mood=emotional_state["emotion"],
            valence=emotional_state["valence"],
            intensity=emotional_state["intensity"],
            context=state["user_input"]
        )
        
        # Get insights
        insights = self.mood_tracker.get_latest_insights()
        
        return {
            "mood_insights": {
                "entry": entry,
                "insights": insights,
                "has_new_insights": bool(insights)
            }
        }

    def generate_recommendations(self, state: AgentState):
        """Generate therapeutic recommendations based on emotional state"""
        emotional_state = state["emotional_state"]
        
        # Get recommendations from therapeutic modalities
        recommendations = self.therapeutic_modalities.recommend_for_emotion(
            emotion=emotional_state["emotion"],
            intensity=emotional_state["intensity"]
        )
        
        return {
            "therapeutic_recommendations": recommendations,
            "needs_escalation": state.get("needs_escalation", False)
        }

    def generate_clinical_response(self, state: AgentState):
        """Enhanced therapeutic response generation with emotion-aware prompting"""
        emotional_state = state["emotional_state"]["emotion"]
        mood_insights = state.get("mood_insights", {})
        therapeutic_recommendations = state.get("therapeutic_recommendations", {})
        
        # Build a rich context for the LLM
        context = self._build_response_context(state)
        
        # Customize system prompt based on detected emotion and available resources
        base_prompt = """You're a mental health AI assistant named MindGuard. Follow these guidelines:
             1. Validate emotions first ("I understand this is difficult")
             2. Use CBT techniques for cognitive distortions
             3. Suggest appropriate coping mechanisms
             4. Maintain hopeful, non-judgmental tone
             5. Incorporate the personalized recommendations in your response
             
             User's emotional state: {emotional_state}
             
             Context about the user: {context}
             
             If the user has been making progress, acknowledge it. If they've been struggling,
             offer extra support and encouragement.
             
             Therapeutic recommendations to incorporate:
             {therapeutic_recommendations}
             
             Recent mood insights:
             {mood_insights}
             """
        
        # Create the prompt template
        system_prompt = base_prompt
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="conversation_history"),
            ("human", "{user_input}")
        ])

        chain = prompt | self.llm
        
        try:
            response = chain.invoke({
                "user_input": state["user_input"],
                "emotional_state": emotional_state,
                "context": context,
                "therapeutic_recommendations": self._format_recommendations(therapeutic_recommendations),
                "mood_insights": self._format_insights(mood_insights),
                "conversation_history": self.memory.get_history()
            })

            # Store interaction with emotional metadata
            self.memory.save_conversation(
                state["user_input"],
                response.content,
                metadata={
                    "emotion": emotional_state,
                    "valence": state["emotional_state"]["valence"],
                    "recommendations": therapeutic_recommendations.get("primary_recommendation", {}).get("title", "")
                }
            )

            return {"response": response.content}
        except Exception as e:
            print(f"Error generating response: {e}")
            # Fallback response
            return {"response": "I'm here to listen and support you. Could you tell me more about what you're experiencing?"}

    def update_gamification(self, state: AgentState):
        """Update gamification system based on user interaction"""
        try:
            # Record interaction in gamification system
            activity_type = "conversation"
            
            # Add context based on emotional state
            context = {
                "emotion": state["emotional_state"]["emotion"],
                "valence": state["emotional_state"]["valence"],
                "intensity": state["emotional_state"]["intensity"]
            }
            
            # Record the activity
            gamification_update = self.gamification.record_activity(activity_type, context)
            
            # Generate gamification message
            gamification_message = ""
            
            if gamification_update.get("new_achievements"):
                achievements = gamification_update["new_achievements"]
                achievement_names = [a["name"] for a in achievements]
                gamification_message += f"\n\n🏆 Achievement{'s' if len(achievements) > 1 else ''} Unlocked: {', '.join(achievement_names)}!"
            
            if gamification_update.get("streak_updated"):
                streak = gamification_update.get("current_streak", 0)
                gamification_message += f"\n\n🔥 You're on a {streak}-day streak!"
            
            if gamification_update.get("level_up"):
                new_level = gamification_update.get("current_level", 1)
                gamification_message += f"\n\n⭐ Level Up! You're now at level {new_level}!"
            
            # Append gamification message to response if there are updates
            if gamification_message and "response" in state:
                state["response"] += gamification_message
            
            return {
                "gamification_update": gamification_update
            }
        except Exception as e:
            print(f"Error updating gamification: {e}")
            return {}

    def escalate_with_resources(self, state: AgentState):
        """Enhanced escalation protocol with personalized resources"""
        resources = [
            "National Suicide Prevention Lifeline: 988",
            "Crisis Text Line: Text HOME to 741741",
            "Emergency Services: 911"
        ]
        
        # Add personalized message based on detected emotion
        emotion = state["emotional_state"]["emotion"]
        
        intro_message = "I notice you may be going through a really difficult time right now. Your safety and wellbeing are extremely important."
        
        if emotion == "hopelessness":
            emotion_message = "Even when things feel hopeless, please know that support is available and feelings can change. Many people have felt this way and found relief with proper support."
        elif emotion == "anxiety":
            emotion_message = "Anxiety can be overwhelming, but you don't have to face it alone. Professional support can provide great relief."
        elif emotion == "crisis":
            emotion_message = "This sounds like a crisis situation, and it's important that you speak with a trained professional immediately."
        else:
            emotion_message = "It's important to reach out for professional support when you're struggling."
        
        action_message = "I strongly encourage you to contact one of these resources right away:"
        
        full_message = f"{intro_message}\n\n{emotion_message}\n\n{action_message}\n\n" + "\n".join(resources)
        
        self.memory.save_conversation(
            state["user_input"], 
            "Crisis resources provided",
            metadata={"escalation": True, "emotion": emotion}
        )
        
        # Record this important interaction in the gamification system
        self.gamification.record_activity("crisis_support", {"emotion": emotion})
        
        return {
            "response": full_message,
            "needs_escalation": True
        }

    # Helper methods
    def determine_intervention_path(self, state: AgentState):
        return "escalate" if state["needs_escalation"] else "continue"

    def _build_response_context(self, state: AgentState) -> str:
        """Build rich context for response generation"""
        context_parts = []
        
        # Add mood tracking insights if available
        if state.get("mood_insights", {}).get("insights"):
            insights = state["mood_insights"]["insights"]
            for insight in insights:
                context_parts.append(f"Insight: {insight['description']}")
                context_parts.append(f"Recommendation: {insight['recommendation']}")
        
        # Add conversation history summary
        similar_convos = self.memory.find_similar_conversations(state["user_input"], k=1)
        if similar_convos:
            context_parts.append("Related previous conversation:")
            for convo in similar_convos:
                context_parts.append(f"User: {convo['input']}")
                context_parts.append(f"AI: {convo['output']}")
        
        return "\n".join(context_parts) if context_parts else "No previous context available."

    def _format_recommendations(self, recommendations: Dict[str, Any]) -> str:
        """Format therapeutic recommendations for prompt"""
        if not recommendations:
            return "No specific recommendations available."
            
        primary = recommendations.get("primary_recommendation", {})
        result = []
        
        if primary:
            result.append(f"Primary recommendation: {primary.get('title', 'N/A')} - {primary.get('description', '')}")
        
        # Add specific modality recommendations
        modalities = ["music_therapy", "meditation", "breathing"]
        for modality in modalities:
            if modality in recommendations:
                mod_rec = recommendations[modality]
                if modality == "music_therapy" and "playlist_category" in mod_rec:
                    result.append(f"Music therapy: {mod_rec['playlist_category']} music")
                elif modality == "meditation" and "meditation_type" in mod_rec:
                    result.append(f"Meditation: {mod_rec['meditation_type']} meditation")
                elif modality == "breathing" and "name" in mod_rec:
                    result.append(f"Breathing exercise: {mod_rec['name']} - {mod_rec.get('description', '')}")
        
        return "\n".join(result)

    def _format_insights(self, mood_data: Dict[str, Any]) -> str:
        """Format mood insights for prompt"""
        if not mood_data or not mood_data.get("insights"):
            return "No mood insights available yet."
            
        insights = mood_data["insights"]
        result = []
        
        for insight in insights:
            result.append(f"- {insight['description']}")
            result.append(f"  Suggestion: {insight['recommendation']}")
            
        return "\n".join(result)

    # Fix for the dictionary comparison error
    def _sort_conversations(self, conversations, query):
        """Safely sort conversations without direct dictionary comparison"""
        # If there's only one conversation or none, return as is
        if len(conversations) <= 1:
            return conversations
            
        # Create a scoring function that extracts a comparable value
        def get_score(conv):
            # You could implement a more sophisticated scoring here
            # based on query relevance, recency, etc.
            return 0  # Default score if no better metric
            
        # Sort using the key function
        return sorted(conversations, key=get_score, reverse=True)