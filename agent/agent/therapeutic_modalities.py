"""
Therapeutic modalities module for MindGuard.

This module provides various therapeutic approaches including
music therapy, guided meditation, breathing exercises, and 
other relaxation techniques.
"""

from typing import Dict, List, Any, Optional, Union, Tuple
import os
import json
import random


class TherapeuticModalities:
    """
    Provides access to various therapeutic techniques and resources.
    
    Features:
    - Music therapy recommendations based on emotional state
    - Guided meditation and mindfulness exercises
    - Breathing techniques and grounding exercises
    - Progressive muscle relaxation
    """
    
    def __init__(self, resources_path: str = "./therapeutic_resources"):
        """
        Initialize the therapeutic modalities provider.
        
        Args:
            resources_path: Path to therapeutic resources
        """
        self.resources_path = resources_path
        
        # Initialize modalities
        self.music_therapy = MusicTherapy(os.path.join(resources_path, "music"))
        self.meditation = GuidedMeditation(os.path.join(resources_path, "meditation"))
        self.breathing = BreathingExercises(os.path.join(resources_path, "breathing"))
        
    def recommend_for_emotion(self, emotion: str, intensity: float) -> Dict[str, Any]:
        """Generate personalized therapeutic recommendations based on emotional state."""
        recommendations = {
            "primary_recommendation": {},
            "articles": [],
            "videos": []
        }

        # Map emotions to recommendation categories
        emotion_categories = {
            "anxiety": {
                "primary": {
                    "title": "Anxiety Management Techniques",
                    "description": "Learn evidence-based strategies to manage anxiety and reduce stress.",
                    "type": "Guide",
                    "duration": "10 min read"
                },
                "articles": [
                    {
                        "title": "Understanding and Managing Anxiety",
                        "type": "Article",
                        "duration": "5 min read",
                        "description": "Learn about the science of anxiety and practical coping strategies.",
                        "action": {"label": "Read Now", "url": "/guides/anxiety-management"}
                    },
                    {
                        "title": "Breathing Exercises for Anxiety Relief",
                        "type": "Exercise Guide",
                        "duration": "3 min read",
                        "description": "Simple breathing techniques you can use anywhere to calm anxiety.",
                        "action": {"label": "Start Exercise", "url": "/exercises/breathing"}
                    }
                ],
                "videos": [
                    {
                        "title": "Guided Anxiety Relief Meditation",
                        "type": "Video",
                        "duration": "10 minutes",
                        "description": "A calming meditation session to help reduce anxiety symptoms.",
                        "action": {"label": "Watch Now", "url": "/meditations/anxiety-relief"}
                    }
                ]
            },
            "stress": {
                "primary": {
                    "title": "Stress Management Toolkit",
                    "description": "Essential tools and techniques for managing daily stress.",
                    "type": "Guide",
                    "duration": "15 min read"
                },
                "articles": [
                    {
                        "title": "Quick Stress Relief Techniques",
                        "type": "Guide",
                        "duration": "5 min read",
                        "description": "Fast and effective ways to reduce stress in any situation.",
                        "action": {"label": "Read Now", "url": "/guides/stress-relief"}
                    }
                ],
                "videos": [
                    {
                        "title": "Progressive Muscle Relaxation",
                        "type": "Exercise Video",
                        "duration": "15 minutes",
                        "description": "Learn how to release physical tension and reduce stress.",
                        "action": {"label": "Start Exercise", "url": "/exercises/muscle-relaxation"}
                    }
                ]
            },
            "low_mood": {
                "primary": {
                    "title": "Mood Enhancement Strategies",
                    "description": "Evidence-based techniques to improve your mood and energy levels.",
                    "type": "Guide",
                    "duration": "12 min read"
                },
                "articles": [
                    {
                        "title": "Building a Positive Daily Routine",
                        "type": "Guide",
                        "duration": "8 min read",
                        "description": "Create a daily schedule that supports better mental health.",
                        "action": {"label": "Read Now", "url": "/guides/daily-routine"}
                    }
                ],
                "videos": [
                    {
                        "title": "Mood-Boosting Exercise Routine",
                        "type": "Workout Video",
                        "duration": "20 minutes",
                        "description": "A gentle exercise session designed to increase energy and mood.",
                        "action": {"label": "Start Workout", "url": "/exercises/mood-boost"}
                    }
                ]
            },
            "sleep_issues": {
                "primary": {
                    "title": "Sleep Improvement Guide",
                    "description": "Comprehensive guide to better sleep quality and habits.",
                    "type": "Guide",
                    "duration": "10 min read"
                },
                "articles": [
                    {
                        "title": "Creating a Perfect Sleep Environment",
                        "type": "Guide",
                        "duration": "5 min read",
                        "description": "Tips for optimizing your bedroom for better sleep.",
                        "action": {"label": "Read Now", "url": "/guides/sleep-environment"}
                    }
                ],
                "videos": [
                    {
                        "title": "Bedtime Relaxation Routine",
                        "type": "Relaxation Video",
                        "duration": "15 minutes",
                        "description": "A calming routine to help you prepare for restful sleep.",
                        "action": {"label": "Watch Now", "url": "/relaxation/bedtime"}
                    }
                ]
            }
        }

        # Determine primary emotion category
        if emotion in ["anxiety", "fear", "panic"]:
            category = "anxiety"
        elif emotion in ["stress", "overwhelmed", "tension"]:
            category = "stress"
        elif emotion in ["sadness", "depression", "hopelessness"]:
            category = "low_mood"
        elif emotion in ["insomnia", "fatigue", "exhaustion"]:
            category = "sleep_issues"
        else:
            category = "stress"  # Default category

        # Get recommendations for the category
        category_recs = emotion_categories.get(category, emotion_categories["stress"])

        # Adjust recommendations based on intensity
        if intensity > 0.7:  # High intensity
            recommendations["primary_recommendation"] = {
                "title": "Professional Support Resources",
                "description": "Consider reaching out to a mental health professional for additional support.",
                "type": "Resource Guide",
                "duration": "5 min read",
                "action": {"label": "Find Support", "url": "/resources/professional-help"}
            }
            recommendations["articles"] = category_recs["articles"][:1]  # Limit to most important
            recommendations["videos"] = category_recs["videos"][:1]  # Limit to most important
        else:
            recommendations["primary_recommendation"] = category_recs["primary"]
            recommendations["articles"] = category_recs["articles"]
            recommendations["videos"] = category_recs["videos"]

        return recommendations
    
    def _select_primary_recommendation(self, emotion: str, intensity: float) -> Dict[str, Any]:
        """
        Select the most appropriate primary modality based on emotion and intensity.
        
        Args:
            emotion: The emotional state
            intensity: The intensity of the emotion
            
        Returns:
            Dictionary with primary recommendation
        """
        # For high-intensity difficult emotions, breathing comes first
        if intensity > 0.7 and emotion in ["anxiety", "fear", "anger", "panic", "stress"]:
            return {
                "modality": "breathing",
                "title": "Calming Breath",
                "description": "A quick breathing exercise to help regulate your nervous system",
                "content": self.breathing.get_exercise(emotion, intensity),
            }
            
        # For sadness and grief, music can be more comforting
        elif emotion in ["sadness", "grief", "loneliness"]:
            return {
                "modality": "music",
                "title": "Comforting Sounds",
                "description": "Music selected to validate and process emotions",
                "content": self.music_therapy.recommend_for_emotion(emotion, intensity),
            }
            
        # For general wellbeing and lower intensity, meditation works well
        else:
            return {
                "modality": "meditation",
                "title": "Mindful Moment",
                "description": "A brief meditation to center yourself",
                "content": self.meditation.recommend_for_emotion(emotion),
            }
    
    def _get_supportive_message(self, emotion: str) -> str:
        """Get a supportive message based on the emotional state."""
        messages = {
            "anxiety": "Anxiety is your body's way of responding to stress. These practices can help calm your nervous system.",
            "sadness": "It's okay to feel sad. These resources can help you process your emotions at your own pace.",
            "anger": "Anger often masks other emotions. These practices can help you cool down and understand what's beneath the surface.",
            "fear": "Fear is a natural protection mechanism. These techniques can help you feel safer and more grounded.",
            "joy": "Wonderful! These practices can help you savor and extend this positive feeling.",
            "neutral": "Taking time for yourself is always valuable. These resources can help maintain your balance.",
            "stress": "Your body needs relief from stress. These techniques can help reduce the physical and mental tension you're feeling."
        }
        
        return messages.get(emotion, "These therapeutic approaches can help support your emotional wellbeing.")
    
    def get_quick_exercise(self, duration_seconds: int = 60) -> Dict[str, Any]:
        """
        Get a quick exercise based on available time.
        
        Args:
            duration_seconds: Available time in seconds
            
        Returns:
            A quick exercise that fits within the time constraints
        """
        if duration_seconds < 30:
            return self.breathing.get_quick_exercise()
        elif duration_seconds < 120:
            return self.meditation.get_short_meditation()
        else:
            return random.choice([
                self.meditation.get_meditation_by_duration(duration_seconds),
                self.music_therapy.get_short_playlist()
            ])


class MusicTherapy:
    """Provides music therapy resources and recommendations."""
    
    def __init__(self, resources_path: str = "./therapeutic_resources/music"):
        """
        Initialize the music therapy provider.
        
        Args:
            resources_path: Path to music resources
        """
        self.resources_path = resources_path
        self.playlists = self._initialize_playlists()
        self.binaural_beats = self._initialize_binaural_beats()
        
    def _initialize_playlists(self) -> Dict[str, List[Dict[str, Any]]]:
        """Initialize music playlists for different emotional states."""
        # In a real implementation, this would load from files or a database
        return {
            # Playlists for different emotional states
            "anxiety": [
                {"title": "Calm Waters", "duration": "10:15", "type": "ambient", "url": "https://example.com/calm-waters"},
                {"title": "Forest Sounds", "duration": "15:30", "type": "nature", "url": "https://example.com/forest-sounds"},
                {"title": "Peaceful Piano", "duration": "12:45", "type": "instrumental", "url": "https://example.com/peaceful-piano"},
            ],
            "sadness": [
                {"title": "Gentle Comfort", "duration": "08:20", "type": "instrumental", "url": "https://example.com/gentle-comfort"},
                {"title": "Rainy Day", "duration": "14:10", "type": "ambient", "url": "https://example.com/rainy-day"},
                {"title": "Healing Strings", "duration": "11:35", "type": "classical", "url": "https://example.com/healing-strings"},
            ],
            "anger": [
                {"title": "Release", "duration": "09:45", "type": "rhythmic", "url": "https://example.com/release"},
                {"title": "Ocean Waves", "duration": "16:20", "type": "nature", "url": "https://example.com/ocean-waves"},
                {"title": "Letting Go", "duration": "13:30", "type": "meditation", "url": "https://example.com/letting-go"},
            ],
            "joy": [
                {"title": "Sunrise", "duration": "07:15", "type": "uplifting", "url": "https://example.com/sunrise"},
                {"title": "Celebration", "duration": "08:45", "type": "dynamic", "url": "https://example.com/celebration"},
                {"title": "Morning Light", "duration": "10:20", "type": "instrumental", "url": "https://example.com/morning-light"},
            ],
            "focus": [
                {"title": "Deep Focus", "duration": "25:00", "type": "instrumental", "url": "https://example.com/deep-focus"},
                {"title": "Study Session", "duration": "30:15", "type": "ambient", "url": "https://example.com/study-session"},
                {"title": "Flow State", "duration": "20:30", "type": "electronic", "url": "https://example.com/flow-state"},
            ],
            "sleep": [
                {"title": "Dreaming", "duration": "45:00", "type": "ambient", "url": "https://example.com/dreaming"},
                {"title": "Night Sky", "duration": "60:00", "type": "nature", "url": "https://example.com/night-sky"},
                {"title": "Lullaby", "duration": "35:20", "type": "soft", "url": "https://example.com/lullaby"},
            ]
        }
        
    def _initialize_binaural_beats(self) -> Dict[str, List[Dict[str, Any]]]:
        """Initialize binaural beats for different brain states."""
        return {
            "relaxation": [
                {"title": "Alpha Waves", "frequency": "8-12Hz", "duration": "20:00", "url": "https://example.com/alpha-waves"},
                {"title": "Deep Relaxation", "frequency": "7-10Hz", "duration": "30:00", "url": "https://example.com/deep-relaxation"},
            ],
            "sleep": [
                {"title": "Delta Dreams", "frequency": "1-4Hz", "duration": "45:00", "url": "https://example.com/delta-dreams"},
                {"title": "Sleep Transition", "frequency": "4-7Hz", "duration": "60:00", "url": "https://example.com/sleep-transition"},
            ],
            "focus": [
                {"title": "Beta Focus", "frequency": "15-20Hz", "duration": "25:00", "url": "https://example.com/beta-focus"},
                {"title": "Study Enhancement", "frequency": "12-15Hz", "duration": "40:00", "url": "https://example.com/study-enhancement"},
            ],
            "meditation": [
                {"title": "Theta Meditation", "frequency": "4-8Hz", "duration": "30:00", "url": "https://example.com/theta-meditation"},
                {"title": "Deep Meditation", "frequency": "5-8Hz", "duration": "45:00", "url": "https://example.com/deep-meditation"},
            ]
        }
    
    def recommend_for_emotion(self, emotion: str, intensity: float = 0.5) -> Dict[str, Any]:
        """
        Recommend music based on emotional state.
        
        Args:
            emotion: The emotional state
            intensity: The intensity of the emotion (0.0-1.0)
            
        Returns:
            Dictionary with recommended music
        """
        # Map emotions to playlist categories
        emotion_map = {
            "anxiety": "anxiety",
            "stress": "anxiety",
            "fear": "anxiety",
            "worry": "anxiety",
            "sadness": "sadness",
            "grief": "sadness",
            "depression": "sadness",
            "hopelessness": "sadness",
            "anger": "anger",
            "frustration": "anger",
            "annoyance": "anger",
            "joy": "joy",
            "happiness": "joy",
            "excitement": "joy",
            "contentment": "joy",
            "neutral": "focus",
            "tired": "sleep",
            "exhaustion": "sleep",
            "fatigue": "sleep"
        }
        
        # Get the playlist category
        category = emotion_map.get(emotion.lower(), "focus")
        
        # Select playlist items
        playlist_items = self.playlists.get(category, self.playlists["focus"])
        
        # For high intensity negative emotions, also recommend binaural beats
        binaural_recommendation = None
        if intensity > 0.7 and emotion in ["anxiety", "stress", "fear", "anger"]:
            binaural_recommendation = random.choice(self.binaural_beats["relaxation"])
        elif emotion in ["tired", "exhaustion", "fatigue"]:
            binaural_recommendation = random.choice(self.binaural_beats["focus"])
        
        return {
            "playlist_category": category,
            "recommendations": random.sample(playlist_items, min(2, len(playlist_items))),
            "binaural_beats": binaural_recommendation
        }
    
    def get_playlist_by_goal(self, goal: str) -> List[Dict[str, Any]]:
        """
        Get a playlist based on therapeutic goal.
        
        Args:
            goal: The therapeutic goal (e.g., "relaxation", "sleep", "focus")
            
        Returns:
            List of track recommendations
        """
        if goal.lower() in self.playlists:
            return self.playlists[goal.lower()]
        else:
            # Default to focus playlist
            return self.playlists["focus"]
    
    def get_binaural_beats(self, brain_state: str) -> Dict[str, Any]:
        """
        Get binaural beats for a specific brain state.
        
        Args:
            brain_state: The desired brain state
            
        Returns:
            Binaural beats recommendation
        """
        if brain_state.lower() in self.binaural_beats:
            return random.choice(self.binaural_beats[brain_state.lower()])
        else:
            # Default to relaxation
            return random.choice(self.binaural_beats["relaxation"])
    
    def get_short_playlist(self) -> Dict[str, Any]:
        """Get a short playlist for quick listening."""
        category = random.choice(list(self.playlists.keys()))
        tracks = random.sample(self.playlists[category], min(2, len(self.playlists[category])))
        
        return {
            "type": "short_playlist",
            "category": category,
            "tracks": tracks,
            "message": f"A quick {category} playlist to shift your mood"
        }


class GuidedMeditation:
    """Provides guided meditation and mindfulness resources."""
    
    def __init__(self, resources_path: str = "./therapeutic_resources/meditation"):
        """
        Initialize the guided meditation provider.
        
        Args:
            resources_path: Path to meditation resources
        """
        self.resources_path = resources_path
        self.meditations = self._initialize_meditations()
        
    def _initialize_meditations(self) -> Dict[str, List[Dict[str, Any]]]:
        """Initialize guided meditations for different purposes."""
        # In a real implementation, this would load from files or a database
        return {
            "anxiety": [
                {"title": "Calming Anxiety", "duration": "10:00", "level": "beginner", "url": "https://example.com/calming-anxiety"},
                {"title": "Releasing Worry", "duration": "15:00", "level": "intermediate", "url": "https://example.com/releasing-worry"},
            ],
            "stress": [
                {"title": "Stress Relief", "duration": "08:00", "level": "beginner", "url": "https://example.com/stress-relief"},
                {"title": "Peaceful Mind", "duration": "12:00", "level": "intermediate", "url": "https://example.com/peaceful-mind"},
            ],
            "sleep": [
                {"title": "Bedtime Relaxation", "duration": "20:00", "level": "beginner", "url": "https://example.com/bedtime-relaxation"},
                {"title": "Deep Sleep", "duration": "30:00", "level": "intermediate", "url": "https://example.com/deep-sleep"},
            ],
            "focus": [
                {"title": "Mindful Focus", "duration": "07:00", "level": "beginner", "url": "https://example.com/mindful-focus"},
                {"title": "Concentration", "duration": "12:00", "level": "intermediate", "url": "https://example.com/concentration"},
            ],
            "self-compassion": [
                {"title": "Loving Kindness", "duration": "10:00", "level": "beginner", "url": "https://example.com/loving-kindness"},
                {"title": "Self-Care", "duration": "15:00", "level": "intermediate", "url": "https://example.com/self-care"},
            ],
            "gratitude": [
                {"title": "Gratitude Practice", "duration": "08:00", "level": "beginner", "url": "https://example.com/gratitude-practice"},
                {"title": "Appreciation", "duration": "12:00", "level": "intermediate", "url": "https://example.com/appreciation"},
            ],
            "body-scan": [
                {"title": "Body Awareness", "duration": "15:00", "level": "beginner", "url": "https://example.com/body-awareness"},
                {"title": "Full Body Scan", "duration": "20:00", "level": "intermediate", "url": "https://example.com/full-body-scan"},
            ]
        }
    
    def recommend_for_emotion(self, emotion: str) -> Dict[str, Any]:
        """
        Recommend meditation based on emotional state.
        
        Args:
            emotion: The emotional state
            
        Returns:
            Dictionary with recommended meditation
        """
        # Map emotions to meditation categories
        emotion_map = {
            "anxiety": "anxiety",
            "stress": "stress",
            "fear": "anxiety",
            "worry": "anxiety",
            "sadness": "self-compassion",
            "grief": "self-compassion",
            "depression": "self-compassion",
            "anger": "stress",
            "frustration": "stress",
            "joy": "gratitude",
            "happiness": "gratitude",
            "neutral": "focus",
            "tired": "body-scan",
            "exhaustion": "body-scan"
        }
        
        # Get the meditation category
        category = emotion_map.get(emotion.lower(), "focus")
        
        # Select meditation items
        meditation_items = self.meditations.get(category, self.meditations["focus"])
        
        return {
            "meditation_type": category,
            "recommendations": random.sample(meditation_items, min(2, len(meditation_items))),
            "message": f"This meditation can help with your current feelings of {emotion}"
        }
    
    def get_meditation_by_duration(self, duration_seconds: int) -> Dict[str, Any]:
        """
        Get a meditation that fits within the specified duration.
        
        Args:
            duration_seconds: Maximum duration in seconds
            
        Returns:
            A meditation recommendation
        """
        all_meditations = []
        for category, meditations in self.meditations.items():
            all_meditations.extend(meditations)
        
        # Filter by duration
        duration_minutes = duration_seconds / 60
        suitable_meditations = [
            m for m in all_meditations 
            if self._parse_duration(m["duration"]) <= duration_minutes
        ]
        
        if suitable_meditations:
            meditation = random.choice(suitable_meditations)
            return {
                "type": "timed_meditation",
                "meditation": meditation,
                "category": next(cat for cat, meds in self.meditations.items() if meditation in meds),
                "message": f"This {meditation['duration']} meditation fits in your available time"
            }
        else:
            # Return the shortest available meditation
            all_meditations.sort(key=lambda m: self._parse_duration(m["duration"]))
            meditation = all_meditations[0]
            return {
                "type": "timed_meditation",
                "meditation": meditation,
                "category": next(cat for cat, meds in self.meditations.items() if meditation in meds),
                "message": "This is our shortest meditation option"
            }
    
    def _parse_duration(self, duration_str: str) -> float:
        """
        Parse duration string (e.g., "10:00") to minutes.
        
        Args:
            duration_str: Duration string in format "MM:SS"
            
        Returns:
            Duration in minutes
        """
        try:
            parts = duration_str.split(":")
            minutes = int(parts[0])
            seconds = int(parts[1]) if len(parts) > 1 else 0
            return minutes + seconds / 60
        except (ValueError, IndexError):
            return 10.0  # Default to 10 minutes
    
    def get_short_meditation(self) -> Dict[str, Any]:
        """Get a short meditation for quick practice."""
        all_meditations = []
        for category, meditations in self.meditations.items():
            all_meditations.extend(meditations)
        
        # Find meditations under 5 minutes
        short_meditations = [
            m for m in all_meditations 
            if self._parse_duration(m["duration"]) <= 5
        ]
        
        if short_meditations:
            meditation = random.choice(short_meditations)
            return {
                "type": "short_meditation",
                "meditation": meditation,
                "message": "A quick meditation to reset your mind"
            }
        else:
            # Get the shortest meditation available
            meditation = min(all_meditations, key=lambda m: self._parse_duration(m["duration"]))
            return {
                "type": "short_meditation",
                "meditation": meditation,
                "message": "A brief meditation practice"
            }


class BreathingExercises:
    """Provides breathing exercises and techniques."""
    
    def __init__(self, resources_path: str = "./therapeutic_resources/breathing"):
        """
        Initialize the breathing exercises provider.
        
        Args:
            resources_path: Path to breathing resources
        """
        self.resources_path = resources_path
        self.exercises = self._initialize_exercises()
        
    def _initialize_exercises(self) -> Dict[str, Dict[str, Any]]:
        """Initialize breathing exercises for different needs."""
        return {
            "calming": {
                "name": "4-7-8 Breathing",
                "description": "Inhale for 4 counts, hold for 7 counts, exhale for 8 counts",
                "instructions": [
                    "Find a comfortable seated position",
                    "Breathe in quietly through your nose for 4 seconds",
                    "Hold your breath for 7 seconds",
                    "Exhale completely through your mouth for 8 seconds",
                    "Repeat this cycle 4 times"
                ],
                "benefits": ["Reduces anxiety", "Helps with sleep", "Lowers stress response"],
                "duration": "2 minutes"
            },
            "energizing": {
                "name": "Bellows Breath",
                "description": "Rapid inhales and exhales to increase energy",
                "instructions": [
                    "Sit comfortably with an upright spine",
                    "Take a deep breath in",
                    "Begin rapid inhales and exhales through your nose (about 2-3 cycles per second)",
                    "Keep your mouth closed but relaxed",
                    "Continue for 15 seconds, then return to normal breathing",
                    "Repeat after a 15-30 second break"
                ],
                "benefits": ["Increases alertness", "Raises energy", "Improves focus"],
                "duration": "1 minute"
            },
            "balancing": {
                "name": "Alternate Nostril Breathing",
                "description": "Alternating breath between nostrils to balance the nervous system",
                "instructions": [
                    "Sit comfortably with an upright spine",
                    "Place your right thumb against your right nostril",
                    "Inhale deeply through your left nostril",
                    "Close your left nostril with your ring finger",
                    "Open your right nostril and exhale",
                    "Inhale through your right nostril",
                    "Close your right nostril, open your left nostril, and exhale",
                    "Continue alternating for 5-10 cycles"
                ],
                "benefits": ["Balances nervous system", "Improves focus", "Reduces stress"],
                "duration": "3 minutes"
            },
            "grounding": {
                "name": "Box Breathing",
                "description": "Equal counts of inhale, hold, exhale, and hold",
                "instructions": [
                    "Sit comfortably and exhale completely",
                    "Inhale through your nose for 4 counts",
                    "Hold your breath for 4 counts",
                    "Exhale through your mouth for 4 counts",
                    "Hold your breath for 4 counts before inhaling",
                    "Repeat for 4 cycles or more"
                ],
                "benefits": ["Reduces stress", "Improves concentration", "Creates calmness"],
                "duration": "2 minutes"
            },
            "emergency": {
                "name": "Quick Calming Breath",
                "description": "A rapid technique to calm panic or anxiety attacks",
                "instructions": [
                    "Breathe in for 4 counts",
                    "Hold for 1 count",
                    "Breathe out for 6 counts",
                    "Repeat until you feel calmer"
                ],
                "benefits": ["Immediate anxiety reduction", "Panic attack management", "Stress response regulation"],
                "duration": "30 seconds"
            }
        }
    
    def get_exercise(self, emotion: str, intensity: float = 0.5) -> Dict[str, Any]:
        """
        Get a breathing exercise based on emotional state.
        
        Args:
            emotion: The emotional state
            intensity: The intensity of the emotion (0.0-1.0)
            
        Returns:
            A breathing exercise recommendation
        """
        # Map emotions to exercise types
        emotion_map = {
            "anxiety": "calming",
            "stress": "calming",
            "fear": "grounding",
            "panic": "emergency",
            "anger": "balancing",
            "frustration": "balancing",
            "sadness": "balancing",
            "tired": "energizing",
            "fatigue": "energizing",
            "neutral": "balancing"
        }
        
        # Determine exercise type, with emergency override for high intensity
        if intensity > 0.8 and emotion in ["anxiety", "fear", "panic"]:
            exercise_type = "emergency"
        else:
            exercise_type = emotion_map.get(emotion.lower(), "balancing")
        
        return self.exercises.get(exercise_type, self.exercises["balancing"])
    
    def get_quick_exercise(self) -> Dict[str, Any]:
        """Get a quick breathing exercise for immediate use."""
        return self.exercises["emergency"]


# Example usage
if __name__ == "__main__":
    therapies = TherapeuticModalities()
    
    # Test recommendations
    anxiety_rec = therapies.recommend_for_emotion("anxiety", 0.7)
    print("Anxiety Recommendations:", anxiety_rec["primary_recommendation"]["title"])
    
    sadness_rec = therapies.recommend_for_emotion("sadness", 0.5)
    print("Sadness Recommendations:", sadness_rec["primary_recommendation"]["title"])
    
    # Test quick exercise
    quick_exercise = therapies.get_quick_exercise(30)
    print("Quick Exercise:", quick_exercise) 