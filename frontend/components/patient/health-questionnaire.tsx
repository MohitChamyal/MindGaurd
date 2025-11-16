"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { apiUrl } from '@/lib/config';

interface Question {
  id: number;
  question: string;
  type: "slider" | "radio" | "textarea";
  min?: number;
  max?: number;
  step?: number;
  labels?: string[];
  options?: Array<{
    value: string;
    label: string;
  }>;
  answer: number | string;
}

interface HealthQuestionnaireProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onComplete?: () => void;
}

interface AnalysisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  message: string;
}

const initialQuestions: Question[] = [
  {
    id: 1,
    question: "How would you rate your overall mood today?",
    type: "slider",
    min: 1,
    max: 10,
    step: 1,
    labels: ["Very low", "Neutral", "Very high"],
    answer: 5
  },
  {
    id: 2,
    question: "Have you experienced any anxiety symptoms in the past 24 hours?",
    type: "radio",
    options: [
      { value: "none", label: "None at all" },
      { value: "mild", label: "Mild symptoms" },
      { value: "moderate", label: "Moderate symptoms" },
      { value: "severe", label: "Severe symptoms" }
    ],
    answer: ""
  },
  {
    id: 3,
    question: "How would you rate your sleep quality last night?",
    type: "slider",
    min: 1,
    max: 10,
    step: 1,
    labels: ["Very poor", "Average", "Excellent"],
    answer: 5
  },
  {
    id: 4,
    question: "How would you rate your energy levels today?",
    type: "slider",
    min: 1,
    max: 10,
    step: 1,
    labels: ["Very low", "Moderate", "Very high"],
    answer: 5
  },
  {
    id: 5,
    question: "Have you experienced any physical symptoms of stress today?",
    type: "radio",
    options: [
      { value: "none", label: "None" },
      { value: "mild", label: "Mild (e.g., slight tension)" },
      { value: "moderate", label: "Moderate (e.g., headache, muscle tension)" },
      { value: "severe", label: "Severe (e.g., chest pain, difficulty breathing)" }
    ],
    answer: ""
  },
  {
    id: 6,
    question: "How would you rate your ability to concentrate today?",
    type: "slider",
    min: 1,
    max: 10,
    step: 1,
    labels: ["Very poor", "Average", "Excellent"],
    answer: 5
  },
  {
    id: 7,
    question: "Have you engaged in any self-care activities today?",
    type: "radio",
    options: [
      { value: "none", label: "None" },
      { value: "minimal", label: "Minimal (basic hygiene)" },
      { value: "moderate", label: "Moderate (exercise, healthy eating)" },
      { value: "extensive", label: "Extensive (multiple activities)" }
    ],
    answer: ""
  },
  {
    id: 8,
    question: "How would you rate your social interactions today?",
    type: "slider",
    min: 1,
    max: 10,
    step: 1,
    labels: ["Very negative", "Neutral", "Very positive"],
    answer: 5
  },
  {
    id: 9,
    question: "Have you experienced any intrusive or recurring thoughts today?",
    type: "radio",
    options: [
      { value: "none", label: "None" },
      { value: "mild", label: "Occasionally" },
      { value: "moderate", label: "Frequently" },
      { value: "severe", label: "Constantly" }
    ],
    answer: ""
  },
  {
    id: 10,
    question: "How optimistic do you feel about the near future?",
    type: "slider",
    min: 1,
    max: 10,
    step: 1,
    labels: ["Very pessimistic", "Neutral", "Very optimistic"],
    answer: 5
  },
  {
    id: 11,
    question: "What are your main sources of stress or concern right now?",
    type: "textarea",
    answer: ""
  },
  {
    id: 12,
    question: "What coping strategies have you used today to manage your emotions?",
    type: "textarea",
    answer: ""
  },
  {
    id: 13,
    question: "How supported do you feel by your social network?",
    type: "slider",
    min: 1,
    max: 10,
    step: 1,
    labels: ["Not at all", "Somewhat", "Very supported"],
    answer: 5
  },
  {
    id: 14,
    question: "Have you had any thoughts of self-harm or suicide?",
    type: "radio",
    options: [
      { value: "none", label: "None" },
      { value: "passive", label: "Passive thoughts only" },
      { value: "active", label: "Active thoughts" },
      { value: "severe", label: "Immediate risk" }
    ],
    answer: ""
  },
  {
    id: 15,
    question: "Is there anything specific you'd like to discuss with a mental health professional?",
    type: "textarea",
    answer: ""
  }
];

export function HealthQuestionnaire({ onSubmit, isLoading, onComplete }: HealthQuestionnaireProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    message: ''
  });

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

  const handleSliderChange = (value: number[]) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].answer = value[0];
    setQuestions(updatedQuestions);
  };

  const handleRadioChange = (value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].answer = value;
    setQuestions(updatedQuestions);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].answer = e.target.value;
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async () => {
    try {
      setAnalysisState({
        status: 'analyzing',
        message: 'AI engine is analyzing your responses...'
      });

      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

      if (!userId || !token) {
        throw new Error('Authentication required');
      }

      const formattedData = {
        user_id: userId,
        mood: questions[0].answer as number,
        anxiety: questions[1].answer as string,
        sleep_quality: questions[2].answer as number,
        energy_levels: questions[3].answer as number,
        physical_symptoms: questions[4].answer as string,
        concentration: questions[5].answer as number,
        self_care: questions[6].answer as string,
        social_interactions: questions[7].answer as number,
        intrusive_thoughts: questions[8].answer as string,
        optimism: questions[9].answer as number,
        stress_factors: questions[10].answer as string,
        coping_strategies: questions[11].answer as string,
        social_support: questions[12].answer as number,
        self_harm: questions[13].answer as string,
        discuss_professional: questions[14].answer as string
      };

      setAnalysisState({
        status: 'analyzing',
        message: 'Processing responses and generating insights...'
      });

      const response = await fetch(`${apiUrl}/api/health-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      setAnalysisState({
        status: 'complete',
        message: 'Analysis complete! Switching to insights...'
      });

      // Short delay before switching to insights tab
      setTimeout(() => {
        if (onComplete) {
          onComplete(); // This will trigger the tab switch in the parent component
        }
      }, 1500);

    } catch (error) {
      console.error("Error saving responses:", error);
      setAnalysisState({
        status: 'error',
        message: 'Failed to analyze responses. Please try again.'
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleReset = () => {
    setQuestions(initialQuestions);
    setCurrentQuestion(0);
    setCompleted(false);
  };

  if (analysisState.status === 'analyzing' || analysisState.status === 'complete') {
    return (
      <div className="space-y-6">
        {analysisState.status === 'analyzing' ? (
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
        ) : (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">Assessment Complete</h3>
            <p className="text-muted-foreground">Thank you for completing the assessment.</p>
            <div className="flex justify-center gap-4">
              <Button onClick={handleSubmit} disabled={isLoading}>
                Submit Responses
              </Button>
              <Button onClick={handleReset} variant="outline">
                Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-muted-foreground text-right">
        Question {currentQuestion + 1} of {questions.length}
      </p>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{question.question}</h3>

        {question.type === "slider" && (
          <div className="space-y-6 py-4">
            <Slider
              defaultValue={[question.answer as number]}
              max={question.max}
              min={question.min}
              step={question.step}
              onValueChange={handleSliderChange}
            />
            <div className="flex justify-between">
              {question.labels?.map((label, index) => (
                <span key={index} className="text-xs text-muted-foreground">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {question.type === "radio" && (
          <RadioGroup
            value={question.answer as string}
            onValueChange={handleRadioChange}
            className="space-y-3"
          >
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === "textarea" && (
          <Textarea
            placeholder="Type your answer here..."
            value={question.answer as string}
            onChange={handleTextareaChange}
            rows={4}
          />
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0 || isLoading}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </Button>
        <Button 
          onClick={currentQuestion === questions.length - 1 ? handleSubmit : handleNext}
          disabled={isLoading}
          className="gap-2"
        >
          {currentQuestion === questions.length - 1 ? (
            isLoading ? "Submitting..." : "Complete"
          ) : (
            <>Next <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}