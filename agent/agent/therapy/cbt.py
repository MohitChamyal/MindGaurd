"""
Cognitive Behavioral Therapy (CBT) module for MindGuard.

This module provides CBT techniques, exercises, and thought reframing strategies
that can be used by the AI agent to deliver evidence-based therapeutic interventions.
"""

from typing import Dict, List, Tuple, Optional
import re


class CBTModule:
    """
    CBT Module for guided therapeutic interventions.
    
    This class provides structured CBT techniques for identifying and 
    reframing negative thought patterns, implementing behavioral activation,
    and offering guided exercises for anxiety and depression.
    """
    
    def __init__(self):
        """Initialize the CBT module."""
        # Common cognitive distortions with examples and reframing strategies
        self.cognitive_distortions = {
            "all-or-nothing": {
                "patterns": [
                    "always", "never", "completely", "totally", "perfect", 
                    "failure", "disaster", "ruined"
                ],
                "description": "Seeing things in black-and-white categories",
                "examples": [
                    "I always mess up everything",
                    "If I can't do it perfectly, I've failed completely"
                ],
                "reframing": [
                    "Are there any gray areas or middle ground I'm not seeing?",
                    "Can I think of any exceptions to this absolute statement?",
                    "Would I judge someone else this harshly for a partial success?"
                ]
            },
            "overgeneralization": {
                "patterns": [
                    "everything", "everyone", "no one", "nobody", "nothing", 
                    "every time", "all people"
                ],
                "description": "Taking a single negative event as a never-ending pattern",
                "examples": [
                    "Nothing ever works out for me",
                    "Everyone always lets me down"
                ],
                "reframing": [
                    "Can I think of any counterexamples to this generalization?",
                    "Am I using words like 'always' or 'never' when the situation is more complex?",
                    "How might I view this as a single event rather than a pattern?"
                ]
            },
            "catastrophizing": {
                "patterns": [
                    "terrible", "awful", "horrible", "disaster", "catastrophe", 
                    "worst", "can't stand it", "unbearable"
                ],
                "description": "Expecting the worst possible outcome",
                "examples": [
                    "This headache means I probably have a brain tumor",
                    "If I make a mistake in this presentation, my career is over"
                ],
                "reframing": [
                    "What's the most likely outcome in this situation?",
                    "How have similar situations turned out in the past?",
                    "If the worst did happen, what coping strategies could I use?"
                ]
            },
            "emotional-reasoning": {
                "patterns": [
                    "I feel", "because I feel", "must be", "that means"
                ],
                "description": "Assuming feelings reflect reality",
                "examples": [
                    "I feel like a failure, so I must be one",
                    "I feel stupid, so I must be stupid"
                ],
                "reframing": [
                    "Are my feelings accurate reflections of the facts?",
                    "What evidence contradicts what I'm feeling?",
                    "How would I evaluate this situation if I weren't feeling this way?"
                ]
            },
            "should-statements": {
                "patterns": [
                    "should", "must", "have to", "ought to", "supposed to"
                ],
                "description": "Having rigid rules about how things should be",
                "examples": [
                    "I should always be productive",
                    "I must never inconvenience others"
                ],
                "reframing": [
                    "Is this expectation realistic and reasonable?",
                    "What would happen if I replaced 'should' with 'prefer' or 'would like'?",
                    "Would I hold someone else to this same standard?"
                ]
            },
            "personalization": {
                "patterns": [
                    "my fault", "because of me", "I'm responsible", "blame me"
                ],
                "description": "Taking responsibility for things outside your control",
                "examples": [
                    "My child is struggling at school. I must be a bad parent.",
                    "The project failed because of my contribution."
                ],
                "reframing": [
                    "What factors besides me contributed to this outcome?",
                    "Am I taking responsibility for something I can't control?",
                    "Would I blame someone else in my position for this outcome?"
                ]
            }
        }
        
        # Guided exercises for different emotional needs
        self.guided_exercises = {
            "anxiety": [
                {
                    "name": "5-4-3-2-1 Grounding",
                    "description": "A sensory awareness exercise to reduce anxiety",
                    "steps": [
                        "Identify 5 things you can see around you",
                        "Acknowledge 4 things you can touch or feel",
                        "Notice 3 things you can hear",
                        "Recognize 2 things you can smell",
                        "Identify 1 thing you can taste"
                    ],
                    "duration": "5 minutes"
                },
                {
                    "name": "Progressive Muscle Relaxation",
                    "description": "Tensing and relaxing different muscle groups",
                    "steps": [
                        "Find a comfortable position and close your eyes",
                        "Tense your feet and toes for 5 seconds, then relax",
                        "Move up to your calves, thighs, abdomen, etc.",
                        "Notice the difference between tension and relaxation",
                        "Continue until you've worked through your entire body"
                    ],
                    "duration": "10-15 minutes"
                },
                {
                    "name": "Worried Thought Log",
                    "description": "Identifying and challenging anxious thoughts",
                    "steps": [
                        "Write down your worried thought",
                        "Rate the intensity of your anxiety (0-100)",
                        "Identify the cognitive distortion",
                        "Write a more balanced alternative thought",
                        "Re-rate your anxiety level after challenging the thought"
                    ],
                    "duration": "10 minutes"
                }
            ],
            "depression": [
                {
                    "name": "Behavioral Activation",
                    "description": "Scheduling pleasant activities to improve mood",
                    "steps": [
                        "Make a list of activities you used to enjoy",
                        "Schedule one small, achievable activity for tomorrow",
                        "Complete the activity even if you don't feel like it",
                        "Note your mood before and after the activity",
                        "Gradually increase the number of activities"
                    ],
                    "duration": "Varies"
                },
                {
                    "name": "Gratitude Journal",
                    "description": "Focusing on positive aspects of life",
                    "steps": [
                        "Each day, write down three things you're grateful for",
                        "They can be small or large things",
                        "Try to be specific and reflect on why you're grateful",
                        "Review your entries when feeling low",
                        "Notice patterns in what brings you joy or satisfaction"
                    ],
                    "duration": "5 minutes daily"
                },
                {
                    "name": "Thought Record",
                    "description": "Challenging negative thoughts",
                    "steps": [
                        "Identify a negative thought",
                        "Rate how strongly you believe it (0-100%)",
                        "List evidence that supports the thought",
                        "List evidence that contradicts the thought",
                        "Develop a more balanced perspective",
                        "Rate how strongly you believe the new thought"
                    ],
                    "duration": "15 minutes"
                }
            ],
            "stress": [
                {
                    "name": "Box Breathing",
                    "description": "Regulated breathing to reduce stress",
                    "steps": [
                        "Breathe in slowly for 4 counts",
                        "Hold your breath for 4 counts",
                        "Exhale slowly for 4 counts",
                        "Hold your breath for 4 counts before inhaling again",
                        "Repeat for 5-10 cycles"
                    ],
                    "duration": "3-5 minutes"
                },
                {
                    "name": "Priority Matrix",
                    "description": "Organizing tasks to reduce feeling overwhelmed",
                    "steps": [
                        "Draw a 2x2 grid (urgent/not urgent, important/not important)",
                        "List all your tasks and place them in the appropriate quadrant",
                        "Focus first on urgent and important tasks",
                        "Schedule time for important but not urgent tasks",
                        "Delegate or eliminate tasks in the other quadrants if possible"
                    ],
                    "duration": "15-20 minutes"
                },
                {
                    "name": "Mindful Observation",
                    "description": "Focusing attention on the present moment",
                    "steps": [
                        "Choose any natural object within your environment",
                        "Focus on watching it for a minute or two",
                        "Observe it as if you're seeing it for the first time",
                        "Explore its colors, textures, patterns, and shapes",
                        "Allow yourself to be fully present with the object"
                    ],
                    "duration": "5 minutes"
                }
            ]
        }
    
    def detect_cognitive_distortions(self, text: str) -> List[Dict]:
        """
        Detect cognitive distortions in user text.
        
        Args:
            text: The user's input text
            
        Returns:
            List of detected distortions with confidence scores
        """
        text = text.lower()
        detected = []
        
        for distortion, info in self.cognitive_distortions.items():
            confidence = 0.0
            matches = []
            
            # Check for pattern matches
            for pattern in info["patterns"]:
                if pattern in text:
                    confidence += 0.2
                    matches.append(pattern)
            
            # Check for example-like statements (more weight)
            for example in info["examples"]:
                example = example.lower()
                similarity = self._calculate_text_similarity(text, example)
                if similarity > 0.5:
                    confidence += 0.3
                    matches.append(f"Similar to: {example}")
            
            # If we found matches, add to detected list
            if matches and confidence > 0.2:
                detected.append({
                    "distortion": distortion,
                    "confidence": min(1.0, confidence),
                    "matches": matches,
                    "description": info["description"],
                    "reframing": info.get("reframing", [])
                })
        
        # Sort by confidence
        detected.sort(key=lambda x: x["confidence"], reverse=True)
        return detected
    
    def get_reframing_questions(self, distortion: str) -> List[str]:
        """
        Get reframing questions for a specific distortion.
        
        Args:
            distortion: The type of cognitive distortion
            
        Returns:
            List of reframing questions or strategies
        """
        if distortion in self.cognitive_distortions:
            return self.cognitive_distortions[distortion].get("reframing", [])
        return []
    
    def suggest_exercise(self, emotional_state: str) -> Dict:
        """
        Suggest an appropriate CBT exercise based on emotional state.
        
        Args:
            emotional_state: The detected emotional state of the user
            
        Returns:
            A guided exercise recommendation
        """
        # Map emotional states to exercise categories
        emotion_to_category = {
            # Anxiety-related emotions
            "anxiety": "anxiety",
            "fear": "anxiety",
            "worry": "anxiety",
            "terror": "anxiety",
            "dread": "anxiety",
            "insecurity": "anxiety",
            
            # Depression-related emotions
            "sadness": "depression",
            "depression": "depression",
            "hopelessness": "depression",
            "grief": "depression",
            "loneliness": "depression",
            "disappointment": "depression",
            "melancholy": "depression",
            
            # Stress-related emotions
            "stress": "stress",
            "overwhelmed": "stress",
            "frustration": "stress",
            "irritation": "stress",
            "anger": "stress",
            "burnout": "stress"
        }
        
        # Determine category
        category = emotion_to_category.get(emotional_state.lower(), "stress")
        
        # Get exercises for that category
        exercises = self.guided_exercises.get(category, [])
        
        # If we have exercises, return one (could be random or tailored)
        if exercises:
            # For now, simply return the first one
            return exercises[0]
        
        # Default exercise if no match
        return {
            "name": "Mindful Breathing",
            "description": "A simple mindfulness exercise to center yourself",
            "steps": [
                "Find a comfortable position and close your eyes",
                "Take a deep breath in through your nose for 4 counts",
                "Hold your breath for 1-2 counts",
                "Exhale slowly through your mouth for 6 counts",
                "Repeat for 5-10 breath cycles"
            ],
            "duration": "5 minutes"
        }
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate a simple similarity score between two texts.
        
        In a production environment, this would use word embeddings or
        more sophisticated NLP techniques. Here we use a simple word overlap.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        # Simple word overlap similarity
        words1 = set(re.findall(r'\w+', text1.lower()))
        words2 = set(re.findall(r'\w+', text2.lower()))
        
        if not words1 or not words2:
            return 0.0
            
        overlap = len(words1.intersection(words2))
        similarity = overlap / max(len(words1), len(words2))
        
        return similarity 