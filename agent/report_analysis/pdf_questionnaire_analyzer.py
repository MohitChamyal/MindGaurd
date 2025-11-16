import os
import json
import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from typing import Dict, List, Any, Optional, Union
import numpy as np
import argparse
from datetime import datetime
import subprocess
import sys

# Try to import simple PDF text extractor first
try:
    from simple_pdf_extractor import extract_text_from_pdf as simple_extract
    SIMPLE_EXTRACTOR_AVAILABLE = True
except ImportError:
    SIMPLE_EXTRACTOR_AVAILABLE = False
    print("Warning: Simple PDF extractor not available.")

# Try to import OCR module
try:
    from ocr import ocr_pdf_to_text, preprocess_image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: Could not import OCR module. Make sure ocr.py is in the same directory.")
    
    # Define fallback OCR function
    def ocr_pdf_to_text(pdf_path, output_txt_path):
        """Fallback OCR function that tries simple extraction first."""
        print(f"OCR module not available. Trying simple text extraction...")
        
        # Try simple extraction if available
        if SIMPLE_EXTRACTOR_AVAILABLE:
            try:
                success = simple_extract(pdf_path, output_txt_path)
                if success:
                    return True
            except Exception as e:
                print(f"Simple extraction failed: {e}")
        
        # If simple extraction failed or not available
        print(f"Error: Could not process PDF {pdf_path}. No extraction method available.")
        with open(output_txt_path, 'w', encoding='utf-8') as f:
            f.write("Error: No PDF extraction method available. Install pdfplumber or PyPDF2.")
        return False

# Download NLTK resources if not already present
# Fix the NLTK download to ensure all required resources are available
def download_nltk_data():
    """Download all required NLTK data packages"""
    resources = ['punkt', 'stopwords']
    for resource in resources:
        try:
            nltk.data.find(f'tokenizers/{resource}') if resource == 'punkt' else nltk.data.find(f'corpora/{resource}')
        except LookupError:
            print(f"Downloading {resource}...")
            nltk.download(resource, quiet=True)

# Download required NLTK data
download_nltk_data()

from nltk.corpus import stopwords
stop_words = set(stopwords.words('english'))

# Simple ML model for text classification
class TextClassifier:
    """
    Simple ML model to classify text segments into different questionnaire categories.
    Uses TF-IDF style features and simple similarity scoring.
    """
    
    def __init__(self):
        # Keywords for each category to use for similarity scoring
        self.category_keywords = {
            "mood": ["mood", "feeling", "emotion", "happy", "sad", "depressed", "content", "happiness", "depression"],
            "anxiety": ["anxiety", "anxious", "worried", "nervous", "tense", "fear", "worry", "panic", "stress"],
            "sleep_quality": ["sleep", "rest", "tired", "insomnia", "nightmare", "dream", "woke", "bed", "nap"],
            "energy_levels": ["energy", "tired", "fatigue", "exhausted", "vigor", "active", "lethargic", "vitality"],
            "physical_symptoms": ["physical", "pain", "ache", "symptom", "body", "headache", "tension", "heart"],
            "concentration": ["focus", "concentration", "distracted", "attention", "memory", "thinking", "foggy"],
            "self_care": ["self-care", "hygiene", "routine", "care", "shower", "exercise", "diet", "health"],
            "social_interactions": ["social", "friends", "family", "interaction", "connect", "talk", "isolate", "lonely"],
            "intrusive_thoughts": ["intrusive", "thought", "thinking", "rumination", "obsessive", "unwanted", "racing"],
            "optimism": ["optimistic", "future", "hope", "positive", "outlook", "despair", "hopeful", "forward"],
            "stress_factors": ["stress", "stressor", "pressure", "overwhelm", "burden", "demand", "workload"],
            "coping_strategies": ["cope", "coping", "strategy", "mechanism", "deal", "manage", "handling", "approach"],
            "social_support": ["support", "network", "help", "friend", "family", "community", "resource", "therapist"],
            "self_harm": ["harm", "hurt", "injury", "suicide", "kill", "die", "end", "life", "worthless"],
            "discuss_professional": ["professional", "therapist", "doctor", "psychiatrist", "counselor", "appointment"]
        }
    
    def preprocess_text(self, text: str) -> List[str]:
        """Preprocess text by tokenizing and removing stopwords."""
        tokens = word_tokenize(text.lower())
        return [word for word in tokens if word.isalpha() and word not in stop_words]
    
    def calculate_similarity(self, text: str, category: str) -> float:
        """Calculate similarity score between text and category keywords."""
        if not text:
            return 0.0
            
        words = self.preprocess_text(text)
        if not words:
            return 0.0
            
        # Count matches with category keywords
        keywords = self.category_keywords[category]
        matches = sum(1 for word in words if word in keywords)
        
        # Calculate similarity score (0-1)
        return min(1.0, matches / max(len(words) * 0.3, 1))
    
    def classify_text(self, text: str) -> Dict[str, float]:
        """Classify text into different categories with confidence scores."""
        if not text:
            return {}
            
        results = {}
        for category in self.category_keywords:
            similarity = self.calculate_similarity(text, category)
            if similarity > 0.1:  # Only include categories with some similarity
                results[category] = similarity
                
        return results

class QuestionnaireAnalyzer:
    """
    Analyzes extracted text from PDFs to identify answers to mental health questionnaire questions.
    Maps the answers to the appropriate format and saves them in JSON format.
    """
    
    def __init__(self, debug=False):
        """
        Initialize the questionnaire analyzer.
        
        Args:
            debug: Whether to print debug information
        """
        self.debug = debug
        self.classifier = TextClassifier()
        
        # Define regex patterns for each parameter type
        self.patterns = {
            "mood": [
                r"mood.+?(\d+)/10",
                r"mood.+?rating.+?(\d+)",
                r"mood.+?score.+?(\d+)",
                r"overall mood.+?(\d+)",
                r"rate your mood.+?(\d+)"
            ],
            "anxiety": [
                r"anxiety.+?(none|mild|moderate|severe)",
                r"anxiety.+?level.+?(none|mild|moderate|severe)",
                r"anxiety.+?symptoms.+?(none|mild|moderate|severe)",
                r"(not anxious|slightly anxious|moderately anxious|severely anxious)"
            ],
            "sleep_quality": [
                r"sleep.+?(\d+)/10",
                r"sleep.+?quality.+?(\d+)",
                r"sleep.+?score.+?(\d+)",
                r"rate your sleep.+?(\d+)",
                r"how well did you sleep.+?(\d+)"
            ],
            "energy_levels": [
                r"energy.+?(\d+)/10",
                r"energy.+?level.+?(\d+)",
                r"energy.+?score.+?(\d+)",
                r"rate your energy.+?(\d+)"
            ],
            "physical_symptoms": [
                r"physical symptoms.+?(none|mild|moderate|severe)",
                r"physical.+?symptoms.+?(none|mild|moderate|severe)",
                r"physical health.+?(good|fair|poor|bad)"
            ],
            "concentration": [
                r"concentration.+?(\d+)/10",
                r"concentration.+?level.+?(\d+)",
                r"focus.+?(\d+)/10",
                r"attention.+?(\d+)/10"
            ],
            "self_care": [
                r"self-care.+?(none|minimal|moderate|extensive)",
                r"self care.+?(none|minimal|moderate|extensive)",
                r"taking care.+?(none|minimal|moderate|extensive)",
                r"(not taking care|taking some care|taking good care)"
            ],
            "social_interactions": [
                r"social.+?(\d+)/10",
                r"social interaction.+?(\d+)",
                r"socializing.+?(\d+)",
                r"social life.+?(\d+)"
            ],
            "intrusive_thoughts": [
                r"intrusive thoughts.+?(none|mild|moderate|severe)",
                r"unwanted thoughts.+?(none|mild|moderate|severe)",
                r"disturbing thoughts.+?(none|mild|moderate|severe)"
            ],
            "optimism": [
                r"optimism.+?(\d+)/10",
                r"positive outlook.+?(\d+)",
                r"hope.+?(\d+)/10",
                r"future.+?outlook.+?(\d+)"
            ],
            "stress_factors": [
                r"stress factors:(.+?)\n",
                r"sources of stress:(.+?)\n",
                r"what causes stress:(.+?)\n",
                r"stressors:(.+?)\n"
            ],
            "coping_strategies": [
                r"coping strategies:(.+?)\n",
                r"coping mechanisms:(.+?)\n",
                r"how do you cope:(.+?)\n",
                r"what helps you cope:(.+?)\n"
            ],
            "social_support": [
                r"social support.+?(\d+)/10",
                r"support from others.+?(\d+)",
                r"support network.+?(\d+)"
            ],
            "self_harm": [
                r"self-harm.+?(none|passive|active|severe)",
                r"self harm.+?(none|passive|active|severe)",
                r"harming yourself.+?(none|passive|active|severe)",
                r"hurting yourself.+?(none|passive|active|severe)"
            ],
            "discuss_professional": [
                r"discuss with professional:(.+?)\n",
                r"professional help:(.+?)\n",
                r"therapy:(.+?)\n",
                r"seeking professional:(.+?)\n"
            ]
        }
        
        # Add patterns to detect structured clinical report format (like the image shows)
        self.table_patterns = {
            "parameter_row": r"(\w+[\s\w-]*)\s+(\w+[\s\w\/]*)\s+(.+)$",
            "score_rating_pattern": r"(?:(\d+)\/10)|(?:(\w+))",
            "clinical_notes_pattern": r"(?:Clinical Notes?:?\s*)?(.+)"
        }
        
        # Value extractors for different types of answers
        self.numeric_extractors = [
            r"(\d+)\s*/\s*10",      # Format: 8/10
            r"(\d+)\s*out of\s*10",  # Format: 8 out of 10 
            r"score\s*:?\s*(\d+)",   # Format: score: 8
            r"rating\s*:?\s*(\d+)",  # Format: rating: 8
            r"level\s*:?\s*(\d+)",   # Format: level: 8
            r"[\s\.\,\:]\s*(\d+)\s*$" # Format: text ending with number
        ]
        
    def extract_value(self, text: str, patterns: List[str]) -> Optional[str]:
        """
        Extract values using regex patterns.
        
        Args:
            text: Text to search in
            patterns: List of regex patterns to try
            
        Returns:
            Extracted value or None if not found
        """
        text = text.lower()  # Convert to lowercase for case-insensitive matching
        
        for pattern in patterns:
            matches = re.search(pattern, text, re.IGNORECASE)
            if matches:
                return matches.group(1).strip()
        
        return None
    
    def extract_numeric_value(self, text: str) -> Optional[str]:
        """Extract numeric values using various formats."""
        for pattern in self.numeric_extractors:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None
    
    def normalize_numeric_value(self, value: str) -> int:
        """
        Normalize numeric values to a 1-10 scale.
        
        Args:
            value: The string value to normalize
            
        Returns:
            Normalized integer value (1-10)
        """
        try:
            num = int(value)
            
            # Adjust scale if needed
            if 0 <= num <= 5:  # If it's on a 0-5 scale
                return num * 2
            elif 0 <= num <= 100:  # If it's on a 0-100 scale
                return max(1, min(10, round(num / 10)))
            
            # Ensure the result is between 1-10
            return max(1, min(10, num))
        except (ValueError, TypeError):
            # Default to middle value if conversion fails
            return 5
            
    def normalize_anxiety(self, value: str) -> str:
        """
        Normalize anxiety values to standard format.
        
        Args:
            value: The string value to normalize
            
        Returns:
            Normalized anxiety level ('none', 'mild', 'moderate', 'severe')
        """
        if not value:
            return "none"
            
        value = value.lower()
        
        if "not" in value or "no " in value or "none" in value:
            return "none"
        elif "mild" in value or "slight" in value or "little" in value:
            return "mild"
        elif "moderate" in value or "some" in value or "medium" in value:
            return "moderate"
        elif "severe" in value or "high" in value or "extreme" in value:
            return "severe"
        
        return "none"  # Default

    def normalize_categorical(self, value: str, categories: List[str]) -> str:
        """
        Normalize categorical values to the closest matching category.
        
        Args:
            value: The string value to normalize
            categories: List of valid categories
            
        Returns:
            Closest matching category
        """
        if not value:
            return categories[0]  # Default to first category
            
        value = value.lower()
        
        # Try exact match first
        for category in categories:
            if category in value:
                return category
                
        # Default to first category if no match
        return categories[0]
    
    def detect_numeric_scale(self, sentence: str) -> Optional[int]:
        """Detect numerical rating in a sentence using ML features."""
        # Check for common numeric patterns
        for i in range(10, 0, -1):  # Check from 10 down to 1
            if f"{i}/10" in sentence or f"{i} out of 10" in sentence or f"rate: {i}" in sentence:
                return i
            
        # Look for standalone numbers at the end of sentences
        match = re.search(r'(\d+)\s*\.?$', sentence)
        if match:
            try:
                num = int(match.group(1))
                if 0 <= num <= 10:
                    return num
            except:
                pass
                
        return None

    def analyze_text(self, text: str) -> Dict[str, Any]:
        """
        Analyze text to extract questionnaire answers.
        
        Args:
            text: Text extracted from PDF
            
        Returns:
            Dictionary of extracted answers
        """
        # Initialize results with default values
        results = {
            "mood": 5,
            "anxiety": "none",
            "sleep_quality": 5,
            "energy_levels": 5,
            "physical_symptoms": "none",
            "concentration": 5,
            "self_care": "moderate",
            "social_interactions": 5,
            "intrusive_thoughts": "none",
            "optimism": 5,
            "stress_factors": "",
            "coping_strategies": "",
            "social_support": 5,
            "self_harm": "none",
            "discuss_professional": ""
        }
        
        # Try to detect if this is a structured clinical report format
        if "MENTAL HEALTH INDICATORS" in text or "Parameter" in text and "Score/Rating" in text and "Clinical Notes" in text:
            if self.debug:
                print("Detected structured clinical report format")
            
            # Extract data from structured table format
            results = self.extract_from_structured_format(text, results)
        else:
            # Break text into sentences for better pattern matching
            try:
                # Try NLTK's sentence tokenizer
                sentences = sent_tokenize(text)
            except LookupError as e:
                # Fallback to a simple rule-based sentence splitter if NLTK fails
                print(f"Warning: NLTK sentence tokenization failed: {e}")
                print("Using fallback sentence tokenizer")
                sentences = self._fallback_sentence_tokenize(text)
                
            text_block = " ".join(sentences)
            
            # Extract values for each parameter
            for param, patterns in self.patterns.items():
                value = self.extract_value(text_block, patterns)
                
                if value:
                    if self.debug:
                        print(f"Extracted {param}: {value}")
                    
                    # Process different parameter types
                    if param in ["mood", "sleep_quality", "energy_levels", "concentration", "optimism", "social_interactions", "social_support"]:
                        results[param] = self.normalize_numeric_value(value)
                    elif param == "anxiety":
                        results[param] = self.normalize_anxiety(value)
                    elif param == "physical_symptoms":
                        results[param] = self.normalize_categorical(value, ["none", "mild", "moderate", "severe"])
                    elif param == "self_care":
                        results[param] = self.normalize_categorical(value, ["none", "minimal", "moderate", "extensive"])
                    elif param == "intrusive_thoughts":
                        results[param] = self.normalize_categorical(value, ["none", "mild", "moderate", "severe"])
                    elif param == "self_harm":
                        results[param] = self.normalize_categorical(value, ["none", "passive", "active", "severe"])
                    else:
                        # For text fields, just use the extracted value
                        results[param] = value.strip()

            # Enhanced ML-based extraction for sentences that didn't match patterns
            # This helps with catching less structured answers or alternative phrasings
            for sentence in sentences:
                # Skip very short sentences
                if len(sentence.split()) < 3:
                    continue
                    
                # Use classifier to determine what type of information this sentence contains
                classifications = self.classifier.classify_text(sentence)
                
                # Sort by confidence scores
                sorted_classes = sorted(classifications.items(), key=lambda x: x[1], reverse=True)
                
                # Check top classifications
                for category, confidence in sorted_classes:
                    # Only consider high-confidence matches
                    if confidence < 0.2:
                        continue
                        
                    # Skip if we already have a value for this category
                    if category in results and isinstance(results[category], str) and results[category]:
                        continue
                    
                    if self.debug:
                        print(f"ML classified '{sentence}' as {category} (confidence: {confidence:.2f})")
                    
                    # Handle different parameter types
                    if category in ["mood", "sleep_quality", "energy_levels", "concentration", 
                                  "optimism", "social_interactions", "social_support"]:
                        # Look for numeric values
                        num_value = self.detect_numeric_scale(sentence)
                        if num_value is not None:
                            results[category] = num_value
                            if self.debug:
                                print(f"  Extracted numeric value: {num_value}")
                            
                    elif category == "anxiety":
                        # Look for anxiety levels
                        if any(term in sentence.lower() for term in ["severe", "extreme", "debilitating"]):
                            results[category] = "severe"
                        elif any(term in sentence.lower() for term in ["moderate", "medium", "significant"]):
                            results[category] = "moderate"
                        elif any(term in sentence.lower() for term in ["mild", "slight", "little"]):
                            results[category] = "mild"
                        elif any(term in sentence.lower() for term in ["none", "no anxiety", "not anxious"]):
                            results[category] = "none"
                            
                    elif category in ["physical_symptoms", "intrusive_thoughts"]:
                        # Look for severity indicators
                        if any(term in sentence.lower() for term in ["severe", "extreme", "a lot"]):
                            results[category] = "severe"
                        elif any(term in sentence.lower() for term in ["moderate", "some", "several"]):
                            results[category] = "moderate"
                        elif any(term in sentence.lower() for term in ["mild", "slight", "minor"]):
                            results[category] = "mild"
                        elif any(term in sentence.lower() for term in ["none", "no symptoms", "not experiencing"]):
                            results[category] = "none"
                            
                    elif category == "self_care":
                        # Look for self-care indicators
                        if any(term in sentence.lower() for term in ["extensive", "comprehensive", "excellent"]):
                            results[category] = "extensive"
                        elif any(term in sentence.lower() for term in ["moderate", "adequate", "regular"]):
                            results[category] = "moderate"
                        elif any(term in sentence.lower() for term in ["minimal", "little", "basic"]):
                            results[category] = "minimal"
                        elif any(term in sentence.lower() for term in ["none", "no self-care", "neglect"]):
                            results[category] = "none"
                            
                    elif category == "self_harm":
                        # Look for self-harm indicators
                        if any(term in sentence.lower() for term in ["severe", "attempt", "plan"]):
                            results[category] = "severe"
                        elif any(term in sentence.lower() for term in ["active", "considering", "thinking about"]):
                            results[category] = "active"
                        elif any(term in sentence.lower() for term in ["passive", "thoughts", "fleeting"]):
                            results[category] = "passive"
                        elif any(term in sentence.lower() for term in ["none", "no thoughts", "not considering"]):
                            results[category] = "none"
                            
                    elif category in ["stress_factors", "coping_strategies", "discuss_professional"]:
                        # These are text fields, so just store the sentence
                        if not results[category]:  # Only set if empty
                            results[category] = sentence
        
        return results
    
    def extract_from_structured_format(self, text: str, default_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract data from a structured clinical report format like in the image.
        
        Args:
            text: The extracted text
            default_results: Default results to use as base
            
        Returns:
            Dictionary of extracted values
        """
        results = default_results.copy()
        
        # Split text into lines
        lines = text.split('\n')
        
        # Process parameter rows in table
        parameter_mapping = {
            "Mood": "mood",
            "Anxiety": "anxiety",
            "Sleep Quality": "sleep_quality",
            "Energy Levels": "energy_levels",
            "Physical Symptoms": "physical_symptoms", 
            "Concentration": "concentration",
            "Self-Care": "self_care",
            "Social Interactions": "social_interactions",
            "Intrusive Thoughts": "intrusive_thoughts",
            "Optimism": "optimism",
            "Social Support": "social_support",
            "Self-Harm": "self_harm"
        }
        
        # Process data for each parameter from table rows
        for line in lines:
            line = line.strip()
            
            # Look for parameter rows
            for param_display, param_key in parameter_mapping.items():
                if param_display in line:
                    # Extract rating
                    if "/10" in line:
                        # Extract numeric rating
                        match = re.search(r'(\d+)/10', line)
                        if match:
                            value = int(match.group(1))
                            results[param_key] = value
                    
                    # Extract categorical ratings
                    for category in ["none", "minimal", "mild", "moderate", "severe", "passive", "active"]:
                        if category.lower() in line.lower():
                            if param_key in ["self_harm"]:
                                results[param_key] = category.lower()
                            elif param_key in ["anxiety", "physical_symptoms", "intrusive_thoughts"]:
                                results[param_key] = category.lower()
                            elif param_key == "self_care":
                                results[param_key] = category.lower()
        
        # Extract additional clinical data sections
        additional_data_sections = {
            "Stress Factors:": "stress_factors",
            "Coping Strategies:": "coping_strategies",
            "Discussion About Professional Support:": "discuss_professional"
        }
        
        current_section = None
        section_content = ""
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this line starts a new section
            new_section = False
            for section_title, section_key in additional_data_sections.items():
                if section_title.lower() in line.lower() or (section_title.split(':')[0].lower() in line.lower() and ':' in line):
                    # Save previous section if there was one
                    if current_section and section_content:
                        results[current_section] = section_content.strip()
                    
                    # Start new section
                    current_section = section_key
                    section_content = line.split(':', 1)[1].strip() if ':' in line else ""
                    new_section = True
                    break
            
            # If not a new section and we're in a section, append this line
            if not new_section and current_section:
                section_content += " " + line
        
        # Save the last section
        if current_section and section_content:
            results[current_section] = section_content.strip()
            
        return results
    
    def _fallback_sentence_tokenize(self, text: str) -> List[str]:
        """
        Simple fallback sentence tokenizer in case NLTK's tokenizer fails.
        
        Args:
            text: Text to tokenize
            
        Returns:
            List of sentences
        """
        # Basic sentence splitting on common end-of-sentence punctuation
        # followed by space or newline and capital letter
        sentences = []
        current_sentence = ""
        
        for char in text:
            current_sentence += char
            if char in ['.', '!', '?', '\n']:
                # Check if this might be the end of a sentence
                sentences.append(current_sentence.strip())
                current_sentence = ""
        
        # Add any remaining text
        if current_sentence.strip():
            sentences.append(current_sentence.strip())
            
        # Filter out empty sentences and very short ones (likely noise)
        sentences = [s for s in sentences if len(s) > 3]
        
        return sentences
    
    def analyze_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """
        Analyze a PDF containing questionnaire answers.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary of extracted answers
        """
        # Check if PDF file exists
        if not os.path.exists(pdf_path):
            print(f"Error: PDF file not found: {pdf_path}")
            return {
                "error": f"PDF file not found: {pdf_path}",
                "timestamp": datetime.now().isoformat()
            }
            
        # Check file extension
        _, ext = os.path.splitext(pdf_path)
        if ext.lower() != '.pdf':
            print(f"Error: File does not appear to be a PDF: {pdf_path}")
            return {
                "error": f"File does not appear to be a PDF: {pdf_path}",
                "timestamp": datetime.now().isoformat()
            }
        
        # Create a temporary text file for OCR output
        temp_txt_path = "temp_ocr_output.txt"
        
        # Run OCR
        try:
            print(f"Processing PDF: {pdf_path}")
            ocr_pdf_to_text(pdf_path, temp_txt_path)
        except Exception as e:
            print(f"Error during OCR processing: {e}")
            return {
                "error": f"OCR processing failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        
        # Check if OCR output file was created and has content
        if not os.path.exists(temp_txt_path) or os.path.getsize(temp_txt_path) == 0:
            print("Error: OCR processing did not produce any text")
            return {
                "error": "OCR processing did not produce any text",
                "timestamp": datetime.now().isoformat()
            }
        
        # Read OCR output
        try:
            with open(temp_txt_path, 'r', encoding='utf-8') as f:
                text = f.read()
                
            if not text or len(text.strip()) == 0:
                print("Error: OCR output is empty")
                return {
                    "error": "OCR output is empty",
                    "timestamp": datetime.now().isoformat()
                }
                
            if self.debug:
                print(f"OCR extracted {len(text)} characters of text")
                
        except Exception as e:
            print(f"Error reading OCR output: {e}")
            return {
                "error": f"Error reading OCR output: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            
        # Analyze the text
        try:
            results = self.analyze_text(text)
        except Exception as e:
            print(f"Error analyzing text: {e}")
            return {
                "error": f"Text analysis failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        
        # Add timestamp
        results["timestamp"] = datetime.now().isoformat()
        
        # Clean up temporary file
        try:
            os.remove(temp_txt_path)
        except Exception as e:
            print(f"Warning: Could not remove temporary file: {e}")
            
        return results
        
    def generate_emotion_report(self, answers: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate an emotion report from the questionnaire answers.
        
        Args:
            answers: Dictionary of questionnaire answers
            
        Returns:
            Dictionary containing the emotional analysis report
        """
        # Convert answers to the format expected by emotion_report_generator.py
        formatted_responses = [
            str(answers["mood"]),
            answers["anxiety"],
            str(answers["sleep_quality"]),
            str(answers["energy_levels"]),
            answers["physical_symptoms"],
            str(answers["concentration"]),
            answers["self_care"],
            str(answers["social_interactions"]),
            answers["intrusive_thoughts"],
            str(answers["optimism"]),
            answers["stress_factors"],
            answers.get("coping_strategies", ""),
            str(answers.get("social_support", 5)),
            answers["self_harm"],
            answers.get("discuss_professional", "")
        ]
        
        # Serialize responses for emotion report generator
        responses_json = json.dumps(formatted_responses)
        
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Path to the emotion report generator script
        agent_path = os.path.join(script_dir, "agent", "agent", "emotion_report_generator.py")
        
        if not os.path.exists(agent_path):
            # Try relative to root
            agent_path = os.path.join(script_dir, "MindGuard", "agent", "agent", "emotion_report_generator.py")
            
        if not os.path.exists(agent_path):
            print(f"Warning: Could not find emotion_report_generator.py at {agent_path}")
            # Return a basic report
            return {
                "summary": {
                    "emotions_count": {"neutral": 1},
                    "average_confidence": 0.5,
                    "average_valence": answers["mood"] / 10.0,
                    "crisis_count": 0,
                    "risk_factors": []
                },
                "disorder_indicators": []
            }
        
        try:
            # Run the emotion report generator script
            result = subprocess.run(
                ["python", agent_path],
                input=responses_json,
                text=True,
                capture_output=True
            )
            
            if result.returncode != 0:
                print(f"Error generating emotion report: {result.stderr}")
                raise Exception(f"Error: {result.stderr}")
                
            # Parse the output
            report = json.loads(result.stdout)
            return report
            
        except Exception as e:
            print(f"Error generating emotion report: {e}")
            # Return a basic report
            return {
                "summary": {
                    "emotions_count": {"neutral": 1},
                    "average_confidence": 0.5,
                    "average_valence": answers["mood"] / 10.0,
                    "crisis_count": 0,
                    "risk_factors": []
                },
                "disorder_indicators": []
            }
            
    def save_to_healthdata_format(self, answers: Dict[str, Any], emotion_report: Dict[str, Any], 
                                  output_path: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Save the questionnaire answers and emotion report in the MindGuard HealthData format.
        
        Args:
            answers: Dictionary of questionnaire answers
            emotion_report: Dictionary containing the emotional analysis report
            output_path: Path to save the JSON file
            user_id: Optional user ID to include in the data
            
        Returns:
            The saved health data
        """
        # Create health data in the expected format
        health_data = {
            "userId": user_id or "user_" + datetime.now().strftime("%Y%m%d%H%M%S"),
            "questionnaireData": {
                "mood": answers["mood"],
                "anxiety": answers["anxiety"],
                "sleep_quality": answers["sleep_quality"],
                "energy_levels": answers["energy_levels"],
                "physical_symptoms": answers["physical_symptoms"],
                "concentration": answers["concentration"],
                "self_care": answers["self_care"],
                "social_interactions": answers["social_interactions"],
                "intrusive_thoughts": answers["intrusive_thoughts"],
                "optimism": answers["optimism"],
                "stress_factors": answers["stress_factors"],
                "coping_strategies": answers.get("coping_strategies", ""),
                "social_support": answers.get("social_support", 5),
                "self_harm": answers["self_harm"],
                "discuss_professional": answers.get("discuss_professional", "")
            },
            "emotionReport": emotion_report,
            "timestamp": answers["timestamp"],
            "source": "pdf_questionnaire"
        }
        
        # Save to file
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(health_data, f, indent=2)
            print(f"Health data saved to {output_path}")
        except Exception as e:
            print(f"Error saving health data: {e}")
            
        return health_data

# Define a default output path for JSON results
DEFAULT_JSON_OUTPUT = "pdf_health_result.json"

def save_to_json_file(data: Dict[str, Any], file_path: str) -> None:
    """Save data to a JSON file."""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"Data saved to {file_path}")
    except Exception as e:
        print(f"Error saving data to {file_path}: {e}")

# Define your PDF file path directly in the code
DEFAULT_PDF_PATH = "mental_health_report.pdf"  

def main():
    parser = argparse.ArgumentParser(description="Extract questionnaire answers from PDF files")
    parser.add_argument("pdf_path", nargs="?", default=None, help="Path to the PDF file")
    parser.add_argument("--output", "-o", default="pdf_health_result.json", 
                       help="Path to save the JSON output (default: pdf_health_result.json)")
    parser.add_argument("--debug", "-d", action="store_true", help="Enable debug output")
    parser.add_argument("--user-id", help="User ID for the results")
    parser.add_argument("--generate-report", "-r", action="store_true", help="Generate emotion report")
    parser.add_argument("--format", "-f", choices=["raw", "healthdata"], default="raw", 
                       help="Output format (raw or healthdata)")
    parser.add_argument("--test", "-t", action="store_true", 
                       help="Run with sample data for testing (no PDF needed)")
    args = parser.parse_args()
    
    # Create analyzer
    analyzer = QuestionnaireAnalyzer(debug=args.debug)
    
    # Get the output path (prioritize command line argument)
    output_path = args.output
    if args.debug:
        print(f"Output will be saved to: {output_path}")
    
    # Test mode with sample data
    if args.test:
        print("Running in test mode with sample data...")
        sample_results = {
            "mood": 7,
            "anxiety": "moderate",
            "sleep_quality": 6,
            "energy_levels": 5,
            "physical_symptoms": "mild",
            "concentration": 8,
            "self_care": "moderate",
            "social_interactions": 6,
            "intrusive_thoughts": "none",
            "optimism": 7,
            "stress_factors": "Work deadlines and financial concerns",
            "coping_strategies": "Daily meditation and journaling",
            "social_support": 8,
            "self_harm": "none",
            "discuss_professional": "Considering starting therapy soon",
            "timestamp": datetime.now().isoformat()
        }
        
        if args.user_id:
            sample_results["user_id"] = args.user_id
            
        # Save to the specified output file
        save_to_json_file(sample_results, output_path)
        
        # Generate emotion report if requested
        if args.generate_report or args.format == "healthdata":
            print("Generating emotion report...")
            emotion_report = analyzer.generate_emotion_report(sample_results)
            
            if args.format == "healthdata":
                healthdata_output_path = output_path or "sample_healthdata.json"
                analyzer.save_to_healthdata_format(
                    sample_results,
                    emotion_report,
                    healthdata_output_path,
                    args.user_id
                )
                print(f"Sample health data saved to {healthdata_output_path}")
                
        print("Test complete!")
        return
    
    # Use the hardcoded PDF path if no path is provided via command line
    pdf_path = args.pdf_path if args.pdf_path else DEFAULT_PDF_PATH
    
    # Analyze PDF
    print(f"Starting PDF analysis of {pdf_path}...")
    
    try:
        results = analyzer.analyze_pdf(pdf_path)  # Don't pass output path here
    except Exception as e:
        print(f"Error in PDF analysis: {e}")
        return 1
    
    # Save results to the specified JSON file
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        print(f"Data saved to {output_path}")
    except Exception as e:
        print(f"Error saving data to {output_path}: {e}")
        return 1
        
    print(f"Analysis results saved to {output_path}")
    
    # Add user ID if provided
    if args.user_id:
        results["user_id"] = args.user_id
    
    # Generate emotion report if requested
    emotion_report = None
    if args.generate_report or args.format == "healthdata":
        print("Generating emotion report...")
        try:
            emotion_report = analyzer.generate_emotion_report(results)
        except Exception as e:
            print(f"Warning: Could not generate emotion report: {e}")
            emotion_report = {
                "summary": {
                    "emotions_count": {"neutral": 1},
                    "average_confidence": 0.5,
                    "average_valence": results.get("mood", 5) / 10.0,
                    "crisis_count": 0,
                    "risk_factors": []
                },
                "disorder_indicators": []
            }
        
        if args.debug:
            print("Emotion report:")
            print(json.dumps(emotion_report, indent=2))
    
    # Save in MindGuard format if requested
    if args.format == "healthdata":
        try:
            healthdata_output_path = output_path or f"{os.path.splitext(pdf_path)[0]}_healthdata.json"
            health_data = analyzer.save_to_healthdata_format(
                results, 
                emotion_report, 
                healthdata_output_path, 
                args.user_id
            )
        except Exception as e:
            print(f"Error saving health data: {e}")
            return 1
    
    print("Questionnaire analysis complete!")
    if args.debug:
        print("Extracted data:")
        print(json.dumps(results, indent=2))
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 
