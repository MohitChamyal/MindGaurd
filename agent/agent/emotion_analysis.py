"""
Enhanced emotion analysis module for MindGuard.

This module provides functionality for detecting and analyzing emotions
in text, with robust fallback mechanisms for offline usage.
"""

from typing import Dict, List, Any, Optional, Union, Callable
import os
import json
import re

# Try to import transformers, but have fallback if it's not available
try:
    from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False


class EmotionAnalyzer:
    """
    Enhanced emotion analyzer with multiple detection methods and offline support.
    
    Features:
    - Multiple emotion detection models (Hugging Face, rule-based, lexicon-based)
    - Offline support with pre-downloaded models or fallback mechanisms
    - Confidence scoring for detected emotions
    - Support for 27 distinct emotional states
    """
    
    def __init__(self, 
                model_path: str = "j-hartmann/emotion-english-distilroberta-base",
                offline_mode: bool = True,
                cache_dir: Optional[str] = None):
        """
        Initialize the emotion analyzer.
        
        Args:
            model_path: Path to the emotion detection model or model name
            offline_mode: Whether to operate in offline mode
            cache_dir: Directory to cache models and lexicons
        """
        self.model_path = model_path
        self.offline_mode = offline_mode
        self.cache_dir = cache_dir or os.path.join(os.path.dirname(__file__), "cached_models")
        
        # Define rich emotion lexicon for lexicon-based detection
        self.emotion_lexicon = self._initialize_emotion_lexicon()
        
        # Define emotional patterns for rule-based detection
        self.emotion_patterns = self._initialize_emotion_patterns()
        
        # Initialize the primary analyzer with fallbacks
        self.analyzer = self._initialize_analyzer()
        
    def _initialize_emotion_lexicon(self) -> Dict[str, List[str]]:
        """Initialize the emotion lexicon for fallback detection."""
        # Comprehensive emotion lexicon (extended from the original)
        return {
            # Positive emotions
            "joy": ["happy", "joy", "joyful", "delighted", "pleased", "content", "thrilled", "ecstatic", "elated", "glad", "cheerful", "blissful", "jubilant", "excited", "overjoyed"],
            "contentment": ["content", "satisfied", "fulfilled", "peaceful", "calm", "serene", "relaxed", "at ease", "comfortable"],
            "excitement": ["excited", "thrilled", "eager", "enthusiastic", "exhilarated", "animated", "energetic", "pumped"],
            "gratitude": ["grateful", "thankful", "appreciative", "blessed", "fortunate", "indebted"],
            "pride": ["proud", "accomplished", "successful", "confident", "self-assured", "satisfied with oneself"],
            "love": ["love", "adore", "cherish", "affection", "fondness", "passionate", "devoted", "cared", "attachment"],
            "hope": ["hopeful", "optimistic", "encouraged", "positive", "looking forward", "aspirational"],
            
            # Neutral emotions
            "surprise": ["surprised", "shocked", "astonished", "amazed", "startled", "stunned", "unexpected", "bewildered"],
            "confusion": ["confused", "puzzled", "perplexed", "unsure", "uncertain", "disoriented", "bewildered", "lost"],
            "neutral": ["neutral", "fine", "okay", "alright", "so-so", "neither good nor bad", "indifferent"],
            
            # Negative emotions
            "sadness": ["sad", "unhappy", "depressed", "sorrowful", "gloomy", "downcast", "blue", "down", "upset", "miserable", "heartbroken", "disheartened", "despondent"],
            "fear": ["afraid", "scared", "fearful", "terrified", "panicked", "frightened", "petrified", "anxious", "nervous"],
            "anxiety": ["anxious", "worried", "nervous", "tense", "uneasy", "apprehensive", "distressed", "stressed", "restless", "jittery"],
            "anger": ["angry", "mad", "furious", "outraged", "irritated", "annoyed", "enraged", "irate", "infuriated", "agitated", "frustrated"],
            "disgust": ["disgusted", "repulsed", "revolted", "appalled", "nauseated", "offended", "repelled"],
            "frustration": ["frustrated", "annoyed", "thwarted", "exasperated", "irritated", "hindered", "blocked"],
            "guilt": ["guilty", "remorseful", "shameful", "regretful", "apologetic", "sorry", "contrite"],
            "hopelessness": ["hopeless", "despairing", "helpless", "despondent", "worthless", "futile", "desperate", "no point", "no use", "can't see a way out"],
            "loneliness": ["lonely", "alone", "isolated", "abandoned", "neglected", "solitary", "disconnected", "unwanted", "left out"],
            "grief": ["grief", "grieving", "mourning", "bereft", "devastated", "inconsolable"],
            "dread": ["dread", "dreading", "foreboding", "impending doom", "sense of doom", "apprehensive"],
            "embarrassment": ["embarrassed", "humiliated", "mortified", "self-conscious", "ashamed"]
        }
    
    def _initialize_emotion_patterns(self) -> Dict[str, List[str]]:
        """Initialize the emotion patterns for rule-based detection."""
        return {
            # Patterns for suicidal ideation and severe depression
            "crisis": [
                r"(want|thinking about|planning) to (die|end it|kill myself|suicide|take my life)",
                r"(don't|do not|can't|cannot) (see a point|want to live|go on|see a way out)",
                r"(better off|would be better) without me",
                r"(no one|nobody) (would care|would notice|would miss) if I (die|was gone|wasn't here)"
            ],
            
            # Patterns for specific emotions
            "hopelessness": [
                r"(nothing|no point|no use|can't|cannot) (will|ever|going to) (change|get better|improve)",
                r"(feel|feeling) (stuck|trapped|hopeless|helpless|worthless)",
                r"what's the point of (trying|living|going on|anything)",
                r"(never|won't|will not) get better"
            ],
            
            "anxiety": [
                r"(can't|cannot) stop (worrying|thinking about|obsessing over)",
                r"(constantly|always) (anxious|worried|nervous|on edge)",
                r"mind (racing|won't stop|keeps going)",
                r"(panic|anxiety) attack"
            ],
            
            "grief": [
                r"(lost|miss|missing) (someone|him|her|them) (so much|terribly)",
                r"(can't|cannot) (accept|believe) they're gone",
                r"(grieving|mourning) (for|over)",
                r"(heart|soul) is broken"
            ]
        }
    
    def _initialize_analyzer(self) -> Callable:
        """Initialize the primary analyzer with fallbacks."""
    # Try to use transformers if available and not in offline mode
        if TRANSFORMERS_AVAILABLE and not self.offline_mode:
            try:
                # Try to load the model from Hugging Face
                analyzer = pipeline(
                    "text-classification",
                    model=self.model_path,
                    # Remove cache_dir from pipeline creation
                )
                print(f"Successfully loaded Hugging Face emotion analyzer: {self.model_path}")
                return analyzer
            except Exception as e:
                print(f"Could not load Hugging Face model: {e}")
                
                # Try loading from local cache if available
                try:
                    local_model_path = os.path.join(self.cache_dir, "emotion_model")
                    if os.path.exists(local_model_path):
                        model = AutoModelForSequenceClassification.from_pretrained(local_model_path)
                        tokenizer = AutoTokenizer.from_pretrained(local_model_path)
                        analyzer = pipeline(
                            "text-classification",
                            model=model,
                            tokenizer=tokenizer
                            # Don't pass cache_dir here either
                        )
                        print(f"Successfully loaded cached emotion analyzer")
                        return analyzer
                except Exception as e:
                    print(f"Could not load cached model: {e}")
        
        # Fall back to the hybrid analyzer
        print("Using hybrid lexicon and rule-based emotion analyzer (fallback)")
        return self._hybrid_emotion_analyzer
    
    def _hybrid_emotion_analyzer(self, text: str) -> List[Dict[str, Any]]:
        """
        Hybrid lexicon and rule-based emotion analyzer for offline use.
        
        Args:
            text: The text to analyze
            
        Returns:
            A list with emotion predictions and confidence scores
        """
        text_lower = text.lower()
        emotions_scores = {}
        
        # Check for crisis patterns first (highest priority)
        for pattern in self.emotion_patterns.get("crisis", []):
            if re.search(pattern, text_lower):
                return [{"label": "crisis", "score": 0.95}]
        
        # Check for each emotion in the lexicon
        for emotion, keywords in self.emotion_lexicon.items():
            # Count exact keyword matches
            exact_matches = sum(1 for keyword in keywords if f" {keyword} " in f" {text_lower} ")
            
            # Count partial matches (word boundaries less strict)
            partial_matches = sum(1 for keyword in keywords if keyword in text_lower) - exact_matches
            
            # Weight exact matches higher than partial matches
            score = (exact_matches * 0.3) + (partial_matches * 0.1)  # Adjusted weights for better accuracy
            
            # Store if there's any score
            if score > 0:
                emotions_scores[emotion] = score
        
        # Check for specific emotion patterns to boost confidence
        for emotion, patterns in self.emotion_patterns.items():
            if emotion == "crisis":  # We already checked crisis patterns
                continue
                
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    # Add a significant boost for pattern matches
                    emotions_scores[emotion] = emotions_scores.get(emotion, 0) + 0.5  # Increased boost for patterns
        
        # Get the top emotion
        if emotions_scores:
            max_emotion = max(emotions_scores, key=emotions_scores.get)
            max_score = emotions_scores[max_emotion]
            
            # Cap at 0.9 for lexicon-based (less confident than ML model)
            normalized_score = min(max_score, 0.9)
            
            return [{"label": max_emotion, "score": normalized_score}]
        
        # If no emotions detected, default to neutral
        return [{"label": "neutral", "score": 0.7}]
    
    def _advanced_rule_analyzer(self, text: str) -> Dict[str, float]:
        """
        Advanced rule-based analyzer for complex emotional states.
        
        Args:
            text: The text to analyze
            
        Returns:
            Dictionary of emotions and confidence scores
        """
        # TODO: Implement advanced rule-based detection with linguistic patterns
        # and contextual analysis for more accurate offline detection
        pass
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze text for emotional content.
        
        Args:
            text: The text to analyze
            
        Returns:
            Dictionary with detected emotion, confidence, and metadata
        """
        # Skip analysis for very short texts
        if len(text.strip()) < 3:
            return {
                "emotion": "neutral",
                "confidence": 0.7,
                "valence": 0.0,
                "is_crisis": False,
                "intensity": 0.1
            }
        
        # Check for crisis keywords first (safety measure)
        crisis_keywords = [
            "suicide", "kill myself", "end it all", "end my life",
            "want to die", "better off dead", "can't go on", "no reason to live"
        ]
        
        if any(keyword in text.lower() for keyword in crisis_keywords):
            return {
                "emotion": "crisis",
                "confidence": 0.95,
                "valence": -0.9,
                "is_crisis": True,
                "intensity": 0.9
            }
        
        # Analyze with primary analyzer (ML or hybrid)
        try:
            result = self.analyzer(text)[0]
            emotion = result["label"] 
            confidence = result["score"]
            
            # Map emotion to valence (positive/negative scale)
            valence_map = {
                # Positive emotions
                "joy": 0.8, "contentment": 0.7, "excitement": 0.8, "pride": 0.7,
                "gratitude": 0.8, "love": 0.9, "hope": 0.7,
                
                # Neutral emotions
                "surprise": 0.0, "confusion": -0.1, "neutral": 0.0,
                
                # Negative emotions
                "sadness": -0.7, "fear": -0.7, "anger": -0.7, "disgust": -0.6,
                "anxiety": -0.7, "frustration": -0.6, "guilt": -0.6,
                "hopelessness": -0.9, "loneliness": -0.7, "grief": -0.8,
                "dread": -0.7, "embarrassment": -0.5
            }
            
            valence = valence_map.get(emotion, 0.0)
            
            # Determine if this is a potential crisis  
            is_crisis = (
                emotion in ["hopelessness", "sadness", "fear"] and confidence > 0.8
            )
            
            return {
                "emotion": emotion,
                "confidence": confidence,
                "valence": valence,
                "is_crisis": is_crisis,
                "intensity": abs(valence) * confidence
            }
            
        except Exception as e:
            print(f"Error in emotion analysis: {e}")
            # Fall back to a safe neutral response
            return {
                "emotion": "neutral",
                "confidence": 0.5,
                "valence": 0.0,
                "is_crisis": False,
                "intensity": 0.1
            }
    
    def download_models_for_offline(self) -> bool:
        """
        Download models for offline use.
        
        Returns:
            True if successful, False otherwise
        """
        if not TRANSFORMERS_AVAILABLE:
            print("Cannot download models: transformers library not available")
            return False
            
        try:
            # Create cache directory if it doesn't exist
            os.makedirs(self.cache_dir, exist_ok=True)
            
            # Download model and tokenizer
            model = AutoModelForSequenceClassification.from_pretrained(self.model_path)
            tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            
            # Save to local directory
            local_model_path = os.path.join(self.cache_dir, "emotion_model")
            model.save_pretrained(local_model_path)
            tokenizer.save_pretrained(local_model_path)
            
            print(f"Successfully downloaded emotion model to {local_model_path}")
            return True
        except Exception as e:
            print(f"Error downloading models for offline use: {e}")
            return False


# Test the analyzer if run directly
if __name__ == "__main__":
    analyzer = EmotionAnalyzer()
    
    test_texts = [
        "I'm feeling really happy today!",
        "I'm so sad and depressed, nothing seems to work out.",
        "I'm worried about my upcoming exam.",
        "I'm so angry that they cancelled the event!",
        "I don't know what to do anymore, I feel hopeless."
    ]
    
    for text in test_texts:
        result = analyzer.analyze(text)
        print(f"Text: {text}")
        print(f"Emotion: {result['emotion']} (Confidence: {result['confidence']:.2f})")
        print(f"Valence: {result['valence']:.2f}, Crisis: {result['is_crisis']}")
        print("-" * 50) 