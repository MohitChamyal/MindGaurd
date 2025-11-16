from emotion_questions import questions
from emotion_analysis import EmotionAnalyzer
import json
from typing import Dict, Any
import os

class EmotionReportGenerator:
    def __init__(self):
        self.analyzer = EmotionAnalyzer()
        self.responses = []

    def analyze_responses(self, responses: list) -> Dict[str, Any]:
        """Analyze the emotional content of responses."""
        try:
            # Map responses to our format
            mood_response = f"My mood today is {responses[0]} out of 10"
            anxiety_response = f"My anxiety level is {responses[1]}"
            sleep_response = f"My sleep quality was {responses[2]} out of 10"
            self_care_response = f"I {'have' if responses[3] == 'yes' else 'have not'} engaged in self-care today"
            stress_response = responses[4]

            # Analyze each response
            mood_analysis = self.analyzer.analyze(mood_response)
            anxiety_analysis = self.analyzer.analyze(anxiety_response)
            sleep_analysis = self.analyzer.analyze(sleep_response)
            self_care_analysis = self.analyzer.analyze(self_care_response)
            stress_analysis = self.analyzer.analyze(stress_response)

            # Count emotions
            emotions_count = {}
            for analysis in [mood_analysis, anxiety_analysis, sleep_analysis, self_care_analysis, stress_analysis]:
                emotion = analysis["emotion"]
                emotions_count[emotion] = emotions_count.get(emotion, 0) + 1

            # Calculate averages
            avg_confidence = sum(a["confidence"] for a in [mood_analysis, anxiety_analysis, sleep_analysis, self_care_analysis, stress_analysis]) / 5
            avg_valence = sum(a["valence"] for a in [mood_analysis, anxiety_analysis, sleep_analysis, self_care_analysis, stress_analysis]) / 5

            # Determine disorder indicators
            disorder_indicators = []
            
            # Mood-based indicators
            if int(responses[0]) <= 3:
                disorder_indicators.append("Possible Major Depressive Disorder")
            elif int(responses[0]) <= 5:
                disorder_indicators.append("Mild Mood Disturbance")

            # Anxiety-based indicators
            if responses[1] == "severe":
                disorder_indicators.append("Severe Anxiety Disorder")
            elif responses[1] == "moderate":
                disorder_indicators.append("Moderate Anxiety Disorder")
            elif responses[1] == "mild":
                disorder_indicators.append("Mild Anxiety Symptoms")

            # Sleep-based indicators
            if int(responses[2]) <= 3:
                disorder_indicators.append("Severe Sleep Disturbance")
            elif int(responses[2]) <= 5:
                disorder_indicators.append("Moderate Sleep Issues")

            # Self-care indicators
            if responses[3] == "no":
                disorder_indicators.append("Self-Care Deficit")

            # Stress-based analysis
            stress_keywords = ["overwhelmed", "cant cope", "too much", "stressed", "pressure"]
            if any(keyword in responses[4].lower() for keyword in stress_keywords):
                disorder_indicators.append("High Stress Levels")

            return {
                "summary": {
                    "emotions_count": emotions_count,
                    "average_confidence": avg_confidence,
                    "average_valence": avg_valence,
                    "crisis_count": sum(1 for a in [mood_analysis, anxiety_analysis, sleep_analysis, self_care_analysis, stress_analysis] if a["is_crisis"])
                },
                "disorder_indicators": disorder_indicators,
                "status": "success"
            }

        except Exception as e:
            print(f"Error in analyze_responses: {e}")
            return {
                "summary": {
                    "emotions_count": {},
                    "average_confidence": 0.5,
                    "average_valence": 0.0,
                    "crisis_count": 0
                },
                "disorder_indicators": [],
                "status": "error",
                "error": str(e)
            }

if __name__ == "__main__":
    import sys
    import json

    # Read responses from stdin
    try:
        input_data = sys.stdin.read()
        responses = json.loads(input_data)
        
        # Generate report
        generator = EmotionReportGenerator()
        report = generator.analyze_responses(responses)
        
        # Output JSON to stdout
        print(json.dumps(report))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1) 