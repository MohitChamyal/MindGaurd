"""
Mood tracking module for MindGuard.

This module provides functionality for tracking, analyzing, and visualizing
user mood over time, with insights and recommendations based on patterns.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import json
import os


class MoodTracker:
    """
    Mood tracking system that records and analyzes user's emotional states over time.
    
    This tracks emotional patterns, generates insights, and provides
    recommendations based on observed mood trends.
    """
    
    def __init__(self, user_id: str, storage_dir: str = "./data"):
        """
        Initialize the mood tracker.
        
        Args:
            user_id: Unique identifier for the user
            storage_dir: Directory to store mood tracking data
        """
        self.user_id = user_id
        self.storage_dir = storage_dir
        self.mood_data = self._load_mood_data()
        
        # Emotional valence mapping (positive/negative/neutral)
        self.emotion_valence = {
            # Positive emotions
            "joy": 0.8,
            "contentment": 0.7,
            "excitement": 0.8,
            "pride": 0.7,
            "amusement": 0.6,
            "relief": 0.5,
            "gratitude": 0.8,
            "love": 0.9,
            "anticipation": 0.6,
            
            # Neutral emotions
            "surprise": 0.0,
            "confusion": -0.1,
            "boredom": -0.2,
            "neutral": 0.0,
            
            # Negative emotions
            "sadness": -0.7,
            "fear": -0.7,
            "anger": -0.7,
            "disgust": -0.6,
            "anxiety": -0.7,
            "frustration": -0.6,
            "disappointment": -0.5,
            "guilt": -0.6,
            "embarrassment": -0.5,
            "hopelessness": -0.9,
            "loneliness": -0.7,
            "grief": -0.8,
            "worry": -0.6,
            "insecurity": -0.6,
            "terror": -0.9,
            "rage": -0.8,
            "jealousy": -0.6,
            "contempt": -0.6,
            "melancholy": -0.5,
            "dread": -0.7
        }
    
    def _load_mood_data(self) -> List[Dict[str, Any]]:
        """
        Load mood tracking data from storage.
        
        Returns:
            List of mood entries
        """
        # Create directory if it doesn't exist
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Define file path
        file_path = os.path.join(self.storage_dir, f"{self.user_id}_mood.json")
        
        # Load data if file exists
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading mood data: {e}")
                return []
        else:
            return []
    
    def _save_mood_data(self):
        """Save mood tracking data to storage."""
        os.makedirs(self.storage_dir, exist_ok=True)
        file_path = os.path.join(self.storage_dir, f"{self.user_id}_mood.json")
        
        try:
            with open(file_path, 'w') as f:
                json.dump(self.mood_data, f, indent=2)
        except Exception as e:
            print(f"Error saving mood data: {e}")
    
    def record_mood(self, 
                    emotion: str, 
                    intensity: float, 
                    context: Optional[str] = None,
                    triggers: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Record a mood entry with emotion, intensity, and optional context.
        
        Args:
            emotion: The primary emotion (e.g., "joy", "sadness")
            intensity: Intensity of the emotion (0.0-1.0)
            context: Optional contextual information
            triggers: Optional list of triggers that caused the emotion
            
        Returns:
            The recorded mood entry
        """
        # Create mood entry
        entry = {
            "timestamp": datetime.now().isoformat(),
            "emotion": emotion.lower(),
            "intensity": max(0.0, min(1.0, intensity)),  # Ensure in valid range
            "valence": self.emotion_valence.get(emotion.lower(), 0.0) * intensity,
            "context": context,
            "triggers": triggers or []
        }
        
        # Add to mood data
        self.mood_data.append(entry)
        
        # Save to storage
        self._save_mood_data()
        
        return entry
    
    def get_mood_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent mood history.
        
        Args:
            limit: Maximum number of entries to retrieve
            
        Returns:
            List of recent mood entries
        """
        return sorted(
            self.mood_data, 
            key=lambda x: x["timestamp"], 
            reverse=True
        )[:limit]
    
    def get_mood_summary(self, days: int = 7) -> Dict[str, Any]:
        """
        Generate a summary of mood over a specified number of days.
        
        Args:
            days: Number of days to include in summary
            
        Returns:
            Dictionary containing mood summary statistics
        """
        # Calculate cutoff time
        now = datetime.now()
        cutoff = now.replace(
            hour=0, minute=0, second=0, microsecond=0
        ).timestamp() - (days * 86400)
        
        # Filter entries within timeframe
        recent_entries = [
            entry for entry in self.mood_data
            if datetime.fromisoformat(entry["timestamp"]).timestamp() >= cutoff
        ]
        
        if not recent_entries:
            return {
                "period": f"Last {days} days",
                "entries_count": 0,
                "message": "No mood data recorded in this period."
            }
        
        # Calculate statistics
        emotions = [entry["emotion"] for entry in recent_entries]
        valences = [entry["valence"] for entry in recent_entries]
        triggers = []
        for entry in recent_entries:
            if "triggers" in entry and entry["triggers"]:
                triggers.extend(entry["triggers"])
        
        # Count emotions
        emotion_counts = {}
        for emotion in emotions:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        # Find dominant emotion
        dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0]
        
        # Count triggers
        trigger_counts = {}
        for trigger in triggers:
            trigger_counts[trigger] = trigger_counts.get(trigger, 0) + 1
        
        # Find common triggers
        common_triggers = sorted(
            trigger_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]
        
        # Calculate average valence (positive/negative balance)
        avg_valence = sum(valences) / len(valences) if valences else 0
        
        # Detect trends
        is_improving = False
        if len(valences) >= 3:
            # Simple trend detection - average of first half vs second half
            mid_point = len(valences) // 2
            first_half_avg = sum(valences[:mid_point]) / mid_point if mid_point > 0 else 0
            second_half_avg = sum(valences[mid_point:]) / (len(valences) - mid_point) if (len(valences) - mid_point) > 0 else 0
            is_improving = second_half_avg > first_half_avg
        
        return {
            "period": f"Last {days} days",
            "entries_count": len(recent_entries),
            "dominant_emotion": dominant_emotion,
            "emotion_distribution": emotion_counts,
            "average_valence": avg_valence,
            "valence_category": "positive" if avg_valence > 0.1 else ("negative" if avg_valence < -0.1 else "neutral"),
            "common_triggers": common_triggers,
            "is_improving": is_improving
        }
    
    def get_insights(self) -> List[str]:
        """
        Generate insights about mood patterns.
        
        Returns:
            List of insight statements based on mood data
        """
        insights = []
        summary = self.get_mood_summary(days=14)  # Look at last 2 weeks
        
        # No data available
        if summary.get("entries_count", 0) < 3:
            return ["Not enough mood data to generate insights yet."]
        
        # Valence-based insights
        valence_category = summary.get("valence_category")
        if valence_category == "positive":
            insights.append("Your mood has been generally positive over the past two weeks.")
        elif valence_category == "negative":
            insights.append("Your mood has been trending more negative recently.")
        else:
            insights.append("Your mood has been relatively balanced recently.")
        
        # Trend insights
        if summary.get("is_improving"):
            insights.append("Your mood appears to be improving over time.")
        
        # Emotion-specific insights
        dominant_emotion = summary.get("dominant_emotion")
        if dominant_emotion:
            if dominant_emotion in ["sadness", "hopelessness", "grief", "loneliness"]:
                insights.append(
                    f"You've been experiencing {dominant_emotion} frequently. "
                    "Consider trying behavioral activation techniques."
                )
            elif dominant_emotion in ["anxiety", "fear", "worry", "stress"]:
                insights.append(
                    f"You've been feeling {dominant_emotion} often. "
                    "Mindfulness and grounding exercises might help."
                )
            elif dominant_emotion in ["anger", "frustration", "irritation"]:
                insights.append(
                    f"{dominant_emotion.capitalize()} has been common for you lately. "
                    "Relaxation techniques might be beneficial."
                )
        
        # Trigger insights
        common_triggers = summary.get("common_triggers", [])
        if common_triggers:
            triggers_text = ", ".join([trigger for trigger, _ in common_triggers])
            insights.append(f"Common triggers for your emotions include: {triggers_text}.")
        
        return insights
    
    def get_recommendations(self) -> List[Dict[str, Any]]:
        """
        Generate personalized recommendations based on mood patterns.
        
        Returns:
            List of recommendation objects
        """
        recommendations = []
        summary = self.get_mood_summary(days=14)
        
        # Not enough data
        if summary.get("entries_count", 0) < 3:
            return [{
                "type": "general",
                "title": "Start Tracking",
                "description": "Continue recording your moods to receive personalized recommendations."
            }]
        
        # Valence-based recommendations
        valence_category = summary.get("valence_category")
        if valence_category == "negative":
            recommendations.append({
                "type": "activity",
                "title": "Behavioral Activation",
                "description": "Try scheduling small, pleasurable activities into your day."
            })
        
        # Emotion-specific recommendations
        emotion_distribution = summary.get("emotion_distribution", {})
        
        # Depression-related emotions
        depression_emotions = ["sadness", "hopelessness", "grief", "loneliness"]
        depression_count = sum(emotion_distribution.get(e, 0) for e in depression_emotions)
        
        if depression_count > 2:
            recommendations.append({
                "type": "exercise",
                "title": "Gratitude Practice",
                "description": "Write down three things you're grateful for each day to shift perspective."
            })
        
        # Anxiety-related emotions
        anxiety_emotions = ["anxiety", "worry", "fear", "stress"]
        anxiety_count = sum(emotion_distribution.get(e, 0) for e in anxiety_emotions)
        
        if anxiety_count > 2:
            recommendations.append({
                "type": "technique",
                "title": "Progressive Muscle Relaxation",
                "description": "Practice tensing and relaxing muscle groups to reduce physical tension."
            })
        
        # Add a general recommendation if none specific
        if not recommendations:
            recommendations.append({
                "type": "general",
                "title": "Mood Journal",
                "description": "Continue tracking your moods and note what activities impact them positively."
            })
        
        return recommendations 