"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, Volume2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { apiUrl } from '@/lib/config';

interface QuestionnaireResponse {
  
  question: string;
  answer: string;
}

interface AnalysisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  message: string;
}

const questions = [
  "How would you describe your mood today? Please explain how you're feeling.",
  "Could you describe your anxiety levels today? Are you feeling calm, slightly worried, or very anxious?",
  "Tell me about your stress levels. How are you coping with daily pressures?",
  "How did you sleep last night? Please describe the quality and duration of your sleep.",
  "How are your energy levels today? Do you feel energetic, tired, or somewhere in between?",
  "How would you describe your appetite today? Have there been any changes in your eating patterns?",
  "How is your ability to focus and concentrate today? Are you finding it easy or difficult to stay on task?",
  "Tell me about your social interactions today. Have you been connecting with others?",
  "What physical activities have you done today? How active have you been?",
  "How would you describe your motivation levels today? What's driving you or holding you back?",
  "Are you experiencing any physical symptoms? Please describe them in detail.",
  "Have you been taking your prescribed medications? Please tell me about your medication routine.",
  "Have you used any substances in the last 24 hours? If comfortable, please provide details.",
  "Have you had any thoughts of self-harm? Please be honest and know that help is available.",
  "What specific things are causing you distress today? Please describe any concerns or worries."
];

interface VoiceQuestionnaireProps {
  onComplete?: () => void;  // Add this prop for tab switching
}

export function VoiceQuestionnaire({ onComplete }: VoiceQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userId, setUserId] = useState<string>("");
  const router = useRouter();
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    message: ''
  });
  const [currentTranscript, setCurrentTranscript] = useState<string>("");

  useEffect(() => {
    // Load voices when component mounts
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const storedUserId = localStorage.getItem("mindguard_user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = crypto.randomUUID();
      localStorage.setItem("mindguard_user_id", newUserId);
      setUserId(newUserId);
    }
  }, []);

  const speakMessage = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Wait for voices to be loaded
        let voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            const englishVoice = voices.find(voice => 
              voice.lang.includes('en') && voice.name.includes('Natural')
            ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
            
            if (englishVoice) {
              utterance.voice = englishVoice;
            }
          };
        } else {
          const englishVoice = voices.find(voice => 
            voice.lang.includes('en') && voice.name.includes('Natural')
          ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
          
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
        }

        utterance.lang = 'en-US';
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => {
          console.log("Started speaking");
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          console.log("Finished speaking");
          setIsSpeaking(false);
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsSpeaking(false);
          // Don't reject, just resolve and continue
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        console.error('Speech synthesis not supported');
        resolve(); // Resolve anyway to continue the flow
      }
    });
  }, []);

  const startListening = useCallback(() => {
    try {
      // Check if speech recognition is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        setError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
        return;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
        setError("");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Recognized speech:", transcript);
        handleResponse(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        
        let errorMessage = "Failed to recognize speech. ";
        
        switch(event.error) {
          case 'no-speech':
            errorMessage = "No speech detected. Please try speaking again.";
            break;
          case 'audio-capture':
            errorMessage = "Microphone error. Please check your microphone permissions.";
            break;
          case 'not-allowed':
            errorMessage = "Microphone access denied. Please allow microphone permissions.";
            break;
          case 'network':
            errorMessage = "Network error. Please check your internet connection.";
            break;
          default:
            errorMessage += "Please try again.";
        }
        
        setError(errorMessage);
        setIsListening(false);
        
        // Auto-retry for certain errors (except permission denied)
        if (event.error !== 'not-allowed' && event.error !== 'audio-capture') {
          timeoutRef.current = setTimeout(() => {
            if (!isComplete && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
              console.log("Retrying speech recognition...");
              startListening();
            }
          }, 2000);
        }
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("Speech recognition initialization error:", error);
      setError("Failed to initialize speech recognition. Please refresh and try again.");
      setIsListening(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setError, setIsListening]);

  const handleResponse = (response: string) => {
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      setCurrentTranscript(response); // Show what was heard
      
      const newResponses = [...responses];
      newResponses[currentQuestionIndex] = {
        question: questions[currentQuestionIndex],
        answer: response
      };
      setResponses(newResponses);

      // Add a slightly longer delay to allow for more detailed responses
      timeoutRef.current = setTimeout(() => {
        setCurrentTranscript(""); // Clear transcript before next question
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          handleCompletion(newResponses);
        }
      }, 1500); // Increased delay to 1.5 seconds
    }
  };

  const skipQuestion = () => {
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const newResponses = [...responses];
      newResponses[currentQuestionIndex] = {
        question: questions[currentQuestionIndex],
        answer: "Skipped"
      };
      setResponses(newResponses);

      setCurrentTranscript("");
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        handleCompletion(newResponses);
      }
    }
  };

  const handleCompletion = async (finalResponses: QuestionnaireResponse[]) => {
    try {
      setIsComplete(true);
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      setAnalysisState({
        status: 'analyzing',
        message: 'AI engine is analyzing your responses...'
      });

      const userId = localStorage.getItem('mindguard_user_id');
      
      // Try multiple ways to get the auth token
      let token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token) {
        token = localStorage.getItem('token') || undefined;
      }
      if (!token) {
        token = localStorage.getItem('authToken') || undefined;
      }

      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      if (!token) {
        console.warn('No authentication token found. Attempting without token...');
      }

      const formattedData = formatResponsesForBackend(finalResponses);
      const requestBody = {
        ...formattedData,
        user_id: userId,
        assessmentType: 'voice',
        raw_responses: finalResponses.map(r => ({ question: r.question, answer: r.answer }))
      };

      setAnalysisState({
        status: 'analyzing',
        message: 'Processing responses and generating insights...'
      });

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add token if available
      if (token) {
        headers['x-auth-token'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/api/health-tracking`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Failed to save responses: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      setAnalysisState({
        status: 'complete',
        message: 'Analysis complete! Switching to insights...'
      });

      // Speak completion message and then switch to insights
      await speakMessage("Thank you for completing the assessment. Your responses have been analyzed. I'll now show you your insights.");
      
      // Short delay before switching to insights tab
      setTimeout(() => {
        if (onComplete) {
          onComplete(); // This will trigger the tab switch in the parent component
        }
      }, 1500);

    } catch (error) {
      console.error("Error saving responses:", error);
      setError(error instanceof Error ? error.message : 'Failed to analyze responses');
      setAnalysisState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to analyze responses. Please try again.'
      });
      
      // Speak error message
      await speakMessage("I'm sorry, there was an error processing your responses. Please try again or contact support.");
    }
  };

  const formatResponsesForBackend = (responses: QuestionnaireResponse[]) => {
    // Helper function to extract sentiment score (1-10) from response
    const getSentimentScore = (response: string): number => {
      const text = response.toLowerCase();
      // Positive indicators
      if (text.includes('great') || text.includes('excellent') || text.includes('very good')) return 9;
      if (text.includes('good') || text.includes('well') || text.includes('positive')) return 8;
      if (text.includes('okay') || text.includes('fine') || text.includes('alright')) return 6;
      // Negative indicators
      if (text.includes('terrible') || text.includes('awful') || text.includes('very bad')) return 2;
      if (text.includes('bad') || text.includes('poor') || text.includes('not good')) return 3;
      if (text.includes('struggling') || text.includes('difficult')) return 4;
      return 5; // neutral default
    };

    // Helper function to assess anxiety level
    const getAnxietyLevel = (response: string): string => {
      const text = response.toLowerCase();
      if (text.includes('very anxious') || text.includes('extremely') || text.includes('severe')) return 'severe';
      if (text.includes('quite') || text.includes('moderate') || text.includes('somewhat')) return 'moderate';
      if (text.includes('slightly') || text.includes('mild') || text.includes('a little')) return 'mild';
      if (text.includes('calm') || text.includes('relaxed') || text.includes('no anxiety')) return 'none';
      return 'mild'; // default to mild if unclear
    };

    // Helper function to assess physical symptoms
    const getPhysicalSymptomLevel = (response: string): string => {
      const text = response.toLowerCase();
      if (text.includes('no ') || text.includes('none')) return 'none';
      if (text.includes('severe') || text.includes('intense') || text.includes('extreme')) return 'severe';
      if (text.includes('moderate') || text.includes('significant')) return 'moderate';
      return 'mild';
    };

    return {
      mood: getSentimentScore(responses[0].answer),
      anxiety: getAnxietyLevel(responses[1].answer),
      sleep_quality: getSentimentScore(responses[3].answer),
      energy_levels: getSentimentScore(responses[4].answer),
      physical_symptoms: getPhysicalSymptomLevel(responses[10].answer),
      concentration: getSentimentScore(responses[6].answer),
      self_care: responses[8].answer.toLowerCase().includes('no') ? 'none' :
                 responses[8].answer.toLowerCase().includes('little') ? 'minimal' :
                 responses[8].answer.toLowerCase().includes('lot') ? 'extensive' : 'moderate',
      social_interactions: getSentimentScore(responses[7].answer),
      intrusive_thoughts: getPhysicalSymptomLevel(responses[14].answer),
      optimism: getSentimentScore(responses[9].answer),
      stress_factors: responses[14].answer,
      coping_strategies: responses[2].answer,
      social_support: getSentimentScore(responses[7].answer),
      self_harm: responses[13].answer.toLowerCase().includes('no') ? 'none' :
                 responses[13].answer.toLowerCase().includes('thought') ? 'passive' :
                 responses[13].answer.toLowerCase().includes('plan') ? 'active' : 'severe',
      discuss_professional: responses[14].answer,
      // Additional fields for more detailed analysis
      medication_adherence: responses[11].answer,
      substance_use: responses[12].answer,
      appetite_changes: responses[5].answer
    };
  };

  const startQuestionnaire = async () => {
    setIsStarted(true);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setIsComplete(false);
    setError("");

    // More detailed initial instruction
    await speakMessage(
      "I will now ask you several questions about your mental health and well-being. " +
      "Please take your time to answer each question thoroughly and honestly. " +
      "You can speak naturally and provide as much detail as you feel comfortable sharing. " +
      "I'll listen carefully to your responses."
    );
    
    await askCurrentQuestion();
  };

  const askCurrentQuestion = useCallback(async () => {
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      try {
        // Speak the current question
        await speakMessage(questions[currentQuestionIndex]);
        
        // Start listening after speaking
        timeoutRef.current = setTimeout(() => {
          startListening();
        }, 500);
      } catch (error) {
        console.error("Error speaking question:", error);
        setError("Failed to speak question. Please try again.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, speakMessage, startListening]);

  // Effect to handle question progression
  useEffect(() => {
    if (currentQuestionIndex >= 0 && !isComplete) {
      askCurrentQuestion();
    }
  }, [currentQuestionIndex, askCurrentQuestion, isComplete]);

  return (
    <div className="space-y-4 p-4">
      <Card className="p-6">
        <div className="space-y-4">
          {!isStarted ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Voice Mental Health Assessment</h2>
              <p className="mb-4 text-muted-foreground">
                This assessment will ask you questions about your mental health.
                Please speak your answers naturally after each question.
              </p>
              <Button onClick={startQuestionnaire} size="lg">
                Start Assessment
              </Button>
            </div>
          ) : analysisState.status === 'analyzing' ? (
            <div className="space-y-6 text-center py-8">
              <h3 className="text-xl font-semibold">Analyzing Responses</h3>
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{analysisState.message}</p>
              </div>
              <Progress value={analysisState.status === 'analyzing' ? 66 : 100} className="w-full" />
            </div>
          ) : analysisState.status === 'complete' ? (
            <div className="space-y-6 text-center py-8">
              <h3 className="text-xl font-semibold text-green-600">Analysis Complete!</h3>
              <p className="text-muted-foreground">{analysisState.message}</p>
              <Progress value={100} className="w-full" />
            </div>
          ) : isComplete ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Assessment Complete</h3>
              <div className="space-y-2">
                {responses.map((response, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <p className="font-medium">{response.question}</p>
                    <p className="text-muted-foreground">{response.answer}</p>
                  </div>
                ))}
              </div>
              <Button onClick={startQuestionnaire} className="mt-4">
                Start New Assessment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h3>
                <div className="flex items-center gap-2">
                  {isSpeaking && <Volume2 className="h-5 w-5 animate-pulse" />}
                  {isListening && <Mic className="h-5 w-5 text-green-500 animate-pulse" />}
                </div>
              </div>

              <p className="text-lg">{questions[currentQuestionIndex]}</p>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {currentTranscript && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">You said:</p>
                  <p className="text-green-900 mt-1">{currentTranscript}</p>
                </div>
              )}

              <div className="h-20 flex items-center justify-center">
                {isListening ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Mic className="h-8 w-8 text-red-500 animate-pulse" />
                      <span className="text-lg font-medium">Listening...</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Speak your answer clearly</p>
                  </div>
                ) : isSpeaking ? (
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-6 w-6 text-blue-500 animate-pulse" />
                    <span>Reading question...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={skipQuestion}
                  className="flex-1"
                >
                  Skip Question
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (recognitionRef.current) {
                      recognitionRef.current.stop();
                    }
                    setIsStarted(false);
                    setCurrentQuestionIndex(-1);
                    setResponses([]);
                    setError("");
                  }}
                  className="flex-1"
                >
                  Cancel Assessment
                </Button>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
