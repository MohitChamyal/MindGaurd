# emotion_report_generator.py

from emotion_questions import questions
from emotion_analysis import EmotionAnalyzer
import json
from typing import Dict, List
import os
import sys

questions = [
    "How would you describe your overall mood in the past week?",
    "Can you recall a recent moment when you felt particularly happy? What was happening?",
    "What thoughts come to mind when you think about your future?",
    "How often do you feel overwhelmed by your responsibilities?",
    "When was the last time you felt truly relaxed? What were you doing?",
    "Do you find yourself avoiding social situations? If so, why?",
    "How do you cope when you feel stressed or anxious?",
    "Can you describe a time when you felt really sad? What triggered it?",
    "How do you feel about your ability to manage your emotions?",
    "What do you do when you feel like you can't cope with everything?",
    "How often do you experience feelings of hopelessness or despair?",
    "Do you have any recurring thoughts that you find distressing?",
    "How do you feel about seeking help or support from others?",
    "What activities or hobbies bring you joy, and how often do you engage in them?",
    "How do you feel when you think about your relationships with family and friends?",
    "What do you do to take care of your mental health?",
    "How often do you feel lonely, even when you are around others?",
    "Can you describe a situation that makes you feel anxious?",
    "How do you feel about your self-worth and confidence?",
    "What are your thoughts on how you handle criticism or feedback?"
]

class EmotionReportGenerator:
    def __init__(self):
        self.analyzer = EmotionAnalyzer()
        self.responses = []

    def ask_questions(self):
        for question in questions:
            response = input(question + " ")  # Collect user response
            self.responses.append(response)  # Store response

    def analyze_responses(self, responses: List[str]):
        """Analyze the emotional content of responses with enhanced precision."""
        try:
            # Parse responses
            mood = int(responses[0])
            anxiety = responses[1].lower()
            sleep_quality = int(responses[2])
            energy_levels = int(responses[3])
            physical_symptoms = responses[4].lower()
            concentration = int(responses[5])
            self_care = responses[6].lower()
            social_interactions = int(responses[7])
            intrusive_thoughts = responses[8].lower()
            optimism = int(responses[9])
            stress_factors = responses[10]
            coping_strategies = responses[11]
            social_support = int(responses[12])
            self_harm = responses[13].lower()
            professional_discussion = responses[14]

            # Enhanced emotion mapping with detailed analysis
            emotions_count = {}
            
            # Detailed mood analysis
            if mood >= 8:
                emotions_count['joyful'] = 2
                emotions_count['energetic'] = 1
                emotions_count['optimistic'] = 1
            elif mood >= 6:
                emotions_count['content'] = 2
                emotions_count['stable'] = 1
            elif mood >= 4:
                emotions_count['neutral'] = 1
                emotions_count['uncertain'] = 1
            elif mood >= 2:
                emotions_count['sad'] = 1
                emotions_count['discouraged'] = 1
            else:
                emotions_count['depressed'] = 2
                emotions_count['hopeless'] = 1

            # Detailed anxiety analysis
            anxiety_emotions = {
                'none': {'calm': 2, 'relaxed': 1},
                'mild': {'anxious': 1, 'uneasy': 1},
                'moderate': {'anxious': 2, 'stressed': 1, 'worried': 1},
                'severe': {'anxious': 2, 'panicked': 1, 'overwhelmed': 2}
            }
            
            for emotion, count in anxiety_emotions.get(anxiety, {}).items():
                emotions_count[emotion] = emotions_count.get(emotion, 0) + count

            # Calculate risk factors
            risk_factors = []
            crisis_count = 0

            # Analyze risk factors
            if sleep_quality <= 3:
                risk_factors.append("Poor sleep quality")
                crisis_count += 1
            if energy_levels <= 3:
                risk_factors.append("Low energy levels")
            if physical_symptoms in ['moderate', 'severe']:
                risk_factors.append("Significant physical symptoms")
                crisis_count += 1
            if concentration <= 3:
                risk_factors.append("Poor concentration")
            if self_care == 'none':
                risk_factors.append("Neglecting self-care")
                crisis_count += 1
            if social_interactions <= 3:
                risk_factors.append("Social withdrawal")
            if intrusive_thoughts in ['moderate', 'severe']:
                risk_factors.append("Persistent intrusive thoughts")
                crisis_count += 1
            if optimism <= 3:
                risk_factors.append("Low optimism")
            if social_support <= 3:
                risk_factors.append("Limited social support")
            if self_harm in ['active', 'severe']:
                risk_factors.append("Self-harm risk")
                crisis_count += 2

            # Calculate disorder indicators
            disorder_indicators = []
            if anxiety in ['moderate', 'severe'] and mood <= 4:
                disorder_indicators.append("Moderate anxiety-depression indicators")
            if sleep_quality <= 3 and energy_levels <= 3:
                disorder_indicators.append("Sleep disturbance indicators")
            if intrusive_thoughts in ['moderate', 'severe'] and anxiety in ['moderate', 'severe']:
                disorder_indicators.append("Anxiety disorder indicators")
            if self_harm in ['active', 'severe']:
                disorder_indicators.append("Critical risk indicators")

            # Prepare the report
            report = {
                "summary": {
                    "emotions_count": emotions_count,
                    "average_confidence": 0.7,  # Fixed value for now
                    "average_valence": mood / 10.0,
                    "crisis_count": crisis_count,
                    "risk_factors": risk_factors
                },
                "disorder_indicators": disorder_indicators
            }

            return report

        except Exception as e:
            return {
                "error": str(e),
                "summary": {
                    "emotions_count": {"neutral": 1},
                    "average_confidence": 0.5,
                    "average_valence": 0.5,
                    "crisis_count": 0,
                    "risk_factors": []
                },
                "disorder_indicators": []
            }

    def summarize_report(self, analysis_report):
        summary = {
            'total_responses': len(analysis_report),
            'emotions_count': {},
            'crisis_count': 0,
            'average_confidence': 0.0,
            'average_valence': 0.0
        }

        for entry in analysis_report:
            emotion = entry['emotion']
            summary['emotions_count'][emotion] = summary['emotions_count'].get(emotion, 0) + 1
            if entry['is_crisis']:
                summary['crisis_count'] += 1
            summary['average_confidence'] += entry['confidence']
            summary['average_valence'] += entry['valence']

        # Calculate averages only if there are responses
        if summary['total_responses'] > 0:
            summary['average_confidence'] /= summary['total_responses']
            summary['average_valence'] /= summary['total_responses']
        else:
            summary['average_confidence'] = 0.0
            summary['average_valence'] = 0.0

        return summary

    def load_sample_responses(self, file_path: str) -> Dict:
        """Load sample responses from JSON file."""
        try:
            # Get the directory containing this script
            current_dir = os.path.dirname(os.path.abspath(__file__))
            print(f"Current directory: {current_dir}")
            
            # Create sample responses file if it doesn't exist
            sample_responses_path = os.path.join(current_dir, 'sample_responses.json')
            print(f"Looking for sample responses at: {sample_responses_path}")
            
            if not os.path.exists(sample_responses_path):
                print("Sample responses file not found, creating default responses...")
                default_responses = {
                    "greetings": [
                        "Hello! How are you feeling today?",
                        "Welcome back! How has your day been?",
                        "Hi there! I'm here to listen and support you."
                    ],
                    "anxiety_responses": [
                        "I hear that you're feeling anxious. Let's work through this together.",
                        "Anxiety can be overwhelming. Would you like to try some breathing exercises?",
                        "You're not alone in dealing with anxiety. What helps you feel grounded?"
                    ],
                    "depression_responses": [
                        "I'm here to support you through these difficult feelings.",
                        "Depression can make everything feel harder. Small steps are still progress.",
                        "You're showing strength by reaching out. Let's focus on one moment at a time."
                    ],
                    "stress_responses": [
                        "It sounds like you're under a lot of stress. Let's break this down together.",
                        "Stress can be overwhelming. What's the biggest concern on your mind?",
                        "You're handling a lot right now. Would you like to explore some coping strategies?"
                    ],
                    "crisis_responses": [
                        "I'm very concerned about what you're sharing. Would you be open to talking with a crisis counselor?",
                        "Your safety is the top priority right now. Can we connect you with immediate support?",
                        "These feelings are serious, and you deserve immediate support. Let me help you find resources."
                    ]
                }
                
                # Create the file with default responses
                os.makedirs(os.path.dirname(sample_responses_path), exist_ok=True)
                with open(sample_responses_path, 'w') as f:
                    json.dump(default_responses, f, indent=2)
                return default_responses
            
            # Read existing file
            with open(sample_responses_path, 'r') as file:
                return json.load(file)
                
        except Exception as e:
            print(f"Error loading sample responses: {e}")
            # Return default responses if file cannot be loaded
            return {
                "greetings": [
                    "Hello! How are you feeling today?",
                    "Welcome back! How has your day been?",
                    "Hi there! I'm here to listen and support you."
                ],
                "anxiety_responses": [
                    "I hear that you're feeling anxious. Let's work through this together.",
                    "Anxiety can be overwhelming. Would you like to try some breathing exercises?",
                    "You're not alone in dealing with anxiety. What helps you feel grounded?"
                ],
                "depression_responses": [
                    "I'm here to support you through these difficult feelings.",
                    "Depression can make everything feel harder. Small steps are still progress.",
                    "You're showing strength by reaching out. Let's focus on one moment at a time."
                ],
                "stress_responses": [
                    "It sounds like you're under a lot of stress. Let's break this down together.",
                    "Stress can be overwhelming. What's the biggest concern on your mind?",
                    "You're handling a lot right now. Would you like to explore some coping strategies?"
                ],
                "crisis_responses": [
                    "I'm very concerned about what you're sharing. Would you be open to talking with a crisis counselor?",
                    "Your safety is the top priority right now. Can we connect you with immediate support?",
                    "These feelings are serious, and you deserve immediate support. Let me help you find resources."
                ]
            }

    def generate_report(self):
        """Generate a complete emotional analysis report."""
        try:
            # Analyze responses
            analysis_report = self.analyze_responses(self.responses)
            
            # Generate summary
            summary = self.summarize_report(analysis_report)
            
            # Detect potential disorders
            disorder_indicators = self.detect_disorder_indicators(analysis_report)
            
            return {
                "summary": summary,
                "disorder_indicators": disorder_indicators,
                "status": "success"
            }
        except Exception as e:
            print(f"Error generating report: {e}")
            return {
                "summary": {
                    "total_responses": 0,
                    "emotions_count": {},
                    "crisis_count": 0,
                    "average_confidence": 0.0,
                    "average_valence": 0.0
                },
                "disorder_indicators": [],
                "status": "error",
                "error": str(e)
            }

    def detect_disorder_indicators(self, analysis_report):
        disorder_indicators = []
        # Existing disorder detection logic
        if any(entry['emotion'] == 'anxiety' for entry in analysis_report):
            disorder_indicators.append('Possible Anxiety Disorder')
        # Adding new disorders
        if any(entry['emotion'] == 'sadness' for entry in analysis_report):
            disorder_indicators.append('Major Depressive Disorder')
        if any(entry['emotion'] == 'fear' for entry in analysis_report):
            disorder_indicators.append('Generalized Anxiety Disorder')
        if any(entry['emotion'] == 'social_anxiety' for entry in analysis_report):
            disorder_indicators.append('Social Anxiety Disorder')
        if any(entry['emotion'] == 'panic' for entry in analysis_report):
            disorder_indicators.append('Panic Disorder')
        if any(entry['emotion'] == 'trauma' for entry in analysis_report):
            disorder_indicators.append('Post-Traumatic Stress Disorder (PTSD)')
        if any(entry['emotion'] == 'obsessive' for entry in analysis_report):
            disorder_indicators.append('Obsessive-Compulsive Disorder (OCD)')
        if any(entry['emotion'] == 'bipolar' for entry in analysis_report):
            disorder_indicators.append('Bipolar Disorder')
        if any(entry['emotion'] == 'borderline' for entry in analysis_report):
            disorder_indicators.append('Borderline Personality Disorder')
        if any(entry['emotion'] == 'seasonal' for entry in analysis_report):
            disorder_indicators.append('Seasonal Affective Disorder')
        if any(entry['emotion'] == 'adhd' for entry in analysis_report):
            disorder_indicators.append('Attention-Deficit/Hyperactivity Disorder (ADHD)')
        if any(entry['emotion'] == 'eating' for entry in analysis_report):
            disorder_indicators.append('Eating Disorders (e.g., Anorexia, Bulimia)')
        if any(entry['emotion'] == 'substance' for entry in analysis_report):
            disorder_indicators.append('Substance Use Disorder')
        if any(entry['emotion'] == 'schizophrenia' for entry in analysis_report):
            disorder_indicators.append('Schizophrenia')
        if any(entry['emotion'] == 'dissociative' for entry in analysis_report):
            disorder_indicators.append('Dissociative Identity Disorder')
        if any(entry['emotion'] == 'phobia' for entry in analysis_report):
            disorder_indicators.append('Phobias (e.g., Agoraphobia, Specific Phobias)')
        if any(entry['emotion'] == 'chronic_stress' for entry in analysis_report):
            disorder_indicators.append('Chronic Stress Disorder')
        if any(entry['emotion'] == 'adjustment' for entry in analysis_report):
            disorder_indicators.append('Adjustment Disorder')
        if any(entry['emotion'] == 'impulse_control' for entry in analysis_report):
            disorder_indicators.append('Impulse Control Disorder')
        if any(entry['emotion'] == 'sleep' for entry in analysis_report):
            disorder_indicators.append('Sleep Disorders (e.g., Insomnia)')
        if any(entry['emotion'] == 'narcissistic' for entry in analysis_report):
            disorder_indicators.append('Personality Disorders (e.g., Narcissistic Personality Disorder)')
        if any(entry['emotion'] == 'psychotic' for entry in analysis_report):
            disorder_indicators.append('Psychotic Disorders')
        if any(entry['emotion'] == 'somatic' for entry in analysis_report):
            disorder_indicators.append('Somatic Symptom Disorder')
        if any(entry['emotion'] == 'factitious' for entry in analysis_report):
            disorder_indicators.append('Factitious Disorder')
        if any(entry['emotion'] == 'gender_dysphoria' for entry in analysis_report):
            disorder_indicators.append('Gender Dysphoria')
        if any(entry['emotion'] == 'complicated_grief' for entry in analysis_report):
            disorder_indicators.append('Complicated Grief')
        return disorder_indicators

# Example usage
if __name__ == "__main__":
    try:
        # Read input from stdin and strip any whitespace
        input_data = sys.stdin.read().strip()
        print("Received input:", input_data, file=sys.stderr)
        
        # Parse the input JSON
        responses = json.loads(input_data)
        print("Parsed responses:", responses, file=sys.stderr)
        
        # Generate report
        generator = EmotionReportGenerator()
        report = generator.analyze_responses(responses)
        
        # Ensure we're only outputting the JSON to stdout
        print(json.dumps(report, ensure_ascii=False))
        sys.stdout.flush()
    except Exception as e:
        print("Error occurred:", str(e), file=sys.stderr)
        # Return a valid JSON even in case of error
        error_report = {
            "error": str(e),
            "summary": {
                "emotions_count": {"neutral": 1},
                "average_confidence": 0.5,
                "average_valence": 0.5,
                "crisis_count": 0,
                "risk_factors": []
            },
            "disorder_indicators": []
        }
        print(json.dumps(error_report, ensure_ascii=False))
        sys.stdout.flush() 