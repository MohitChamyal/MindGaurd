"""
Music Therapy module for MindGuard.

This module provides functionality for recommending music therapy, binaural beats,
and guided meditation tracks based on user emotional states and therapeutic needs.
"""

from typing import Dict, List, Optional, Any
import random


class MusicTherapy:
    """
    Music therapy recommender that suggests therapeutic audio content.
    
    This class provides personalized recommendations for music, sound therapy,
    and guided audio meditations based on emotional state and therapeutic goals.
    """
    
    def __init__(self):
        """Initialize the music therapy module."""
        # Therapeutic playlists organized by emotional state and goal
        self.playlists = {
            "anxiety_reduction": {
                "name": "Anxiety Relief",
                "description": "Calming tracks to reduce anxiety and promote relaxation",
                "tracks": [
                    {
                        "title": "Ocean Waves",
                        "artist": "Nature Sounds",
                        "duration": "10:32",
                        "description": "Natural ocean waves to induce calm",
                        "url": "https://example.com/tracks/ocean-waves"
                    },
                    {
                        "title": "Forest Rain",
                        "artist": "Ambient Sounds",
                        "duration": "8:45",
                        "description": "Gentle rain sounds in forest setting",
                        "url": "https://example.com/tracks/forest-rain"
                    },
                    {
                        "title": "Peaceful Piano",
                        "artist": "Relaxation Masters",
                        "duration": "15:20",
                        "description": "Slow, gentle piano melodies",
                        "url": "https://example.com/tracks/peaceful-piano"
                    }
                ]
            },
            "mood_elevation": {
                "name": "Mood Boost",
                "description": "Uplifting tracks to improve mood and energy",
                "tracks": [
                    {
                        "title": "Morning Light",
                        "artist": "Positivity Project",
                        "duration": "7:15",
                        "description": "Upbeat instrumental to boost mood",
                        "url": "https://example.com/tracks/morning-light"
                    },
                    {
                        "title": "Joyful Day",
                        "artist": "Happy Tunes",
                        "duration": "6:30",
                        "description": "Light, cheerful melodies",
                        "url": "https://example.com/tracks/joyful-day"
                    },
                    {
                        "title": "Energy Flow",
                        "artist": "Wellness Audio",
                        "duration": "9:45",
                        "description": "Dynamic rhythm to increase energy",
                        "url": "https://example.com/tracks/energy-flow"
                    }
                ]
            },
            "stress_relief": {
                "name": "Stress Reducer",
                "description": "Calming sounds to release tension and stress",
                "tracks": [
                    {
                        "title": "Deep Relaxation",
                        "artist": "Meditation Masters",
                        "duration": "12:30",
                        "description": "Deep tones for complete relaxation",
                        "url": "https://example.com/tracks/deep-relaxation"
                    },
                    {
                        "title": "Tension Release",
                        "artist": "Healing Sounds",
                        "duration": "10:00",
                        "description": "Progressive relaxation soundtrack",
                        "url": "https://example.com/tracks/tension-release"
                    },
                    {
                        "title": "Calm Waters",
                        "artist": "Nature Therapy",
                        "duration": "15:10",
                        "description": "Gentle water sounds for stress relief",
                        "url": "https://example.com/tracks/calm-waters"
                    }
                ]
            },
            "sleep_improvement": {
                "name": "Sleep Well",
                "description": "Soothing sounds to improve sleep quality",
                "tracks": [
                    {
                        "title": "Dreamscape",
                        "artist": "Sleep Solutions",
                        "duration": "30:00",
                        "description": "Extended ambient for deep sleep",
                        "url": "https://example.com/tracks/dreamscape"
                    },
                    {
                        "title": "Night Rain",
                        "artist": "Sleep Sounds",
                        "duration": "45:00",
                        "description": "Gentle rain ambience for sleep",
                        "url": "https://example.com/tracks/night-rain"
                    },
                    {
                        "title": "Deep Sleep Waves",
                        "artist": "Slumber Audio",
                        "duration": "60:00",
                        "description": "Delta wave-enhancing track",
                        "url": "https://example.com/tracks/deep-sleep-waves"
                    }
                ]
            },
            "focus_enhancement": {
                "name": "Deep Focus",
                "description": "Audio designed to improve concentration and focus",
                "tracks": [
                    {
                        "title": "Alpha Waves",
                        "artist": "Brain Boost",
                        "duration": "25:00",
                        "description": "Alpha frequency to enhance focus",
                        "url": "https://example.com/tracks/alpha-waves"
                    },
                    {
                        "title": "Study Session",
                        "artist": "Focus Audio",
                        "duration": "40:00",
                        "description": "Background audio for productive work",
                        "url": "https://example.com/tracks/study-session"
                    },
                    {
                        "title": "Clarity",
                        "artist": "Mind Masters",
                        "duration": "35:00",
                        "description": "Clear thinking enhancement audio",
                        "url": "https://example.com/tracks/clarity"
                    }
                ]
            }
        }
        
        # Binaural beats for different brain states
        self.binaural_beats = {
            "delta": {
                "name": "Delta Waves (0.5-4 Hz)",
                "description": "Deep sleep, healing, and regeneration",
                "tracks": [
                    {
                        "title": "Deep Sleep Delta",
                        "frequency": "2 Hz",
                        "duration": "45:00",
                        "url": "https://example.com/binaural/deep-sleep-delta"
                    },
                    {
                        "title": "Healing Delta",
                        "frequency": "3.5 Hz",
                        "duration": "30:00",
                        "url": "https://example.com/binaural/healing-delta"
                    }
                ]
            },
            "theta": {
                "name": "Theta Waves (4-8 Hz)",
                "description": "Deep relaxation, meditation, creativity",
                "tracks": [
                    {
                        "title": "Creative Theta",
                        "frequency": "6 Hz",
                        "duration": "30:00",
                        "url": "https://example.com/binaural/creative-theta"
                    },
                    {
                        "title": "Meditation Theta",
                        "frequency": "7 Hz",
                        "duration": "45:00",
                        "url": "https://example.com/binaural/meditation-theta"
                    }
                ]
            },
            "alpha": {
                "name": "Alpha Waves (8-14 Hz)",
                "description": "Relaxed alertness, stress reduction, learning",
                "tracks": [
                    {
                        "title": "Relaxed Focus Alpha",
                        "frequency": "10 Hz",
                        "duration": "30:00",
                        "url": "https://example.com/binaural/relaxed-focus-alpha"
                    },
                    {
                        "title": "Learning Alpha",
                        "frequency": "12 Hz",
                        "duration": "25:00",
                        "url": "https://example.com/binaural/learning-alpha"
                    }
                ]
            },
            "beta": {
                "name": "Beta Waves (14-30 Hz)",
                "description": "Active thinking, focus, alertness",
                "tracks": [
                    {
                        "title": "Focus Beta",
                        "frequency": "18 Hz",
                        "duration": "25:00",
                        "url": "https://example.com/binaural/focus-beta"
                    },
                    {
                        "title": "Energy Beta",
                        "frequency": "22 Hz",
                        "duration": "20:00",
                        "url": "https://example.com/binaural/energy-beta"
                    }
                ]
            },
            "gamma": {
                "name": "Gamma Waves (30-100 Hz)",
                "description": "Peak concentration, cognitive enhancement",
                "tracks": [
                    {
                        "title": "Peak Performance Gamma",
                        "frequency": "40 Hz",
                        "duration": "20:00",
                        "url": "https://example.com/binaural/peak-performance-gamma"
                    },
                    {
                        "title": "Cognitive Boost Gamma",
                        "frequency": "35 Hz",
                        "duration": "15:00",
                        "url": "https://example.com/binaural/cognitive-boost-gamma"
                    }
                ]
            }
        }
        
        # Guided meditations for different purposes
        self.guided_meditations = {
            "anxiety": [
                {
                    "title": "Anxiety Relief Meditation",
                    "duration": "15:00",
                    "description": "Guided meditation to reduce anxiety and find calm",
                    "url": "https://example.com/meditation/anxiety-relief"
                },
                {
                    "title": "5-Minute Panic Relief",
                    "duration": "5:00",
                    "description": "Quick meditation for anxiety attacks",
                    "url": "https://example.com/meditation/panic-relief"
                }
            ],
            "depression": [
                {
                    "title": "Mood Lifting Meditation",
                    "duration": "20:00",
                    "description": "Guided practice to elevate mood and find joy",
                    "url": "https://example.com/meditation/mood-lifting"
                },
                {
                    "title": "Self-Compassion Practice",
                    "duration": "18:00",
                    "description": "Developing kindness toward yourself",
                    "url": "https://example.com/meditation/self-compassion"
                }
            ],
            "sleep": [
                {
                    "title": "Sleep Journey",
                    "duration": "30:00",
                    "description": "Guided meditation for falling asleep",
                    "url": "https://example.com/meditation/sleep-journey"
                },
                {
                    "title": "Bedtime Relaxation",
                    "duration": "25:00",
                    "description": "Calming body scan for better sleep",
                    "url": "https://example.com/meditation/bedtime-relaxation"
                }
            ],
            "stress": [
                {
                    "title": "Stress Release",
                    "duration": "15:00",
                    "description": "Let go of tension and stress",
                    "url": "https://example.com/meditation/stress-release"
                },
                {
                    "title": "Peaceful Break",
                    "duration": "10:00",
                    "description": "Quick stress relief for busy days",
                    "url": "https://example.com/meditation/peaceful-break"
                }
            ],
            "focus": [
                {
                    "title": "Focus Builder",
                    "duration": "12:00",
                    "description": "Develop concentration and attention",
                    "url": "https://example.com/meditation/focus-builder"
                },
                {
                    "title": "Clear Mind",
                    "duration": "15:00",
                    "description": "Quiet mental chatter for better focus",
                    "url": "https://example.com/meditation/clear-mind"
                }
            ]
        }
        
        # Mapping from emotions to therapy types
        self.emotion_to_therapy = {
            # Anxiety-related emotions
            "anxiety": ["anxiety_reduction", "theta", "anxiety"],
            "fear": ["anxiety_reduction", "alpha", "anxiety"],
            "worry": ["anxiety_reduction", "alpha", "anxiety"],
            "stress": ["stress_relief", "alpha", "stress"],
            "overwhelmed": ["stress_relief", "theta", "stress"],
            
            # Depression-related emotions
            "sadness": ["mood_elevation", "alpha", "depression"],
            "depression": ["mood_elevation", "alpha", "depression"],
            "hopelessness": ["mood_elevation", "theta", "depression"],
            "loneliness": ["mood_elevation", "alpha", "depression"],
            
            # Low energy states
            "fatigue": ["focus_enhancement", "beta", "focus"],
            "exhaustion": ["stress_relief", "alpha", "stress"],
            "lethargy": ["focus_enhancement", "beta", "focus"],
            
            # Sleep-related
            "insomnia": ["sleep_improvement", "delta", "sleep"],
            "restlessness": ["sleep_improvement", "theta", "sleep"],
            
            # Neutral/positive states that can be enhanced
            "concentration": ["focus_enhancement", "beta", "focus"],
            "calm": ["sleep_improvement", "theta", "meditation"],
            "neutral": ["focus_enhancement", "alpha", "focus"],
            "contentment": ["sleep_improvement", "alpha", "meditation"]
        }
    
    def recommend_for_emotion(self, emotion: str) -> Dict[str, Any]:
        """
        Recommend therapeutic audio based on emotional state.
        
        Args:
            emotion: The detected emotional state
            
        Returns:
            Dictionary with playlist, binaural beat, and meditation recommendations
        """
        # Get therapy types for this emotion
        therapy_types = self.emotion_to_therapy.get(
            emotion.lower(), 
            ["stress_relief", "alpha", "stress"]  # Default if emotion not found
        )
        
        # Get recommendations
        playlist_type, brainwave_type, meditation_type = therapy_types
        
        playlist = self.playlists.get(playlist_type, self.playlists["stress_relief"])
        binaural = self.binaural_beats.get(brainwave_type, self.binaural_beats["alpha"])
        
        # Choose a random track from each
        playlist_track = random.choice(playlist["tracks"]) if playlist["tracks"] else None
        binaural_track = random.choice(binaural["tracks"]) if binaural["tracks"] else None
        
        # Get meditation recommendations
        meditations = self.guided_meditations.get(meditation_type, [])
        meditation = random.choice(meditations) if meditations else None
        
        return {
            "emotion": emotion,
            "music_therapy": {
                "playlist_name": playlist["name"],
                "playlist_description": playlist["description"],
                "recommended_track": playlist_track
            },
            "binaural_beats": {
                "wave_type": binaural["name"],
                "description": binaural["description"],
                "recommended_track": binaural_track
            },
            "guided_meditation": meditation
        }
    
    def get_playlist_by_goal(self, goal: str) -> Dict[str, Any]:
        """
        Get a playlist based on therapeutic goal.
        
        Args:
            goal: The therapeutic goal (e.g., "anxiety_reduction", "mood_elevation")
            
        Returns:
            Playlist information
        """
        return self.playlists.get(goal, self.playlists["stress_relief"])
    
    def get_binaural_by_wave(self, wave_type: str) -> Dict[str, Any]:
        """
        Get binaural beats by brain wave type.
        
        Args:
            wave_type: The brain wave type (e.g., "alpha", "theta")
            
        Returns:
            Binaural beats information
        """
        return self.binaural_beats.get(wave_type, self.binaural_beats["alpha"])
    
    def get_meditation_by_purpose(self, purpose: str) -> List[Dict[str, Any]]:
        """
        Get guided meditations by purpose.
        
        Args:
            purpose: The meditation purpose (e.g., "anxiety", "depression")
            
        Returns:
            List of guided meditations
        """
        return self.guided_meditations.get(purpose, self.guided_meditations["stress"]) 