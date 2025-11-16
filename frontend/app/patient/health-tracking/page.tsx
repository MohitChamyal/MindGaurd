"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthQuestionnaire } from "@/components/patient/health-questionnaire";
import { VoiceQuestionnaire } from "@/components/patient/voice-questionnaire";
import { HealthInsights } from "@/components/patient/health-insights";
import { ProgressCharts } from "@/components/patient/progress-charts";
import Recommendations from "@/components/patient/recommendations";
import { apiUrl } from '@/lib/config';

interface HealthData {
  insights: {
    mainInsight: {
      [key: string]: number;
    };
    riskAnalysis: {
      low: number;
      moderate: number;
      high: number;
    };
    anxietyTrend: {
      status: "increasing" | "decreasing" | "stable";
      percentage: number;
      detail: string;
    };
    stressResponse: {
      status: "improving" | "worsening" | "stable";
      percentage: number;
      detail: string;
    };
    moodStability: {
      status: "stable" | "fluctuating";
      detail: string;
    };
    patterns: string[];
  };
  progress: {
    moodData: Array<{
      date: string;
      mood: number;
      anxiety: number;
      stress: number;
    }>;
    sleepData: Array<{
      date: string;
      hours: number;
      quality: number;
    }>;
    activityData: Array<{
      date: string;
      exercise: number;
      meditation: number;
      social: number;
    }>;
    summary: {
      mood: { change: number };
      anxiety: { change: number };
      stress: { change: number };
      sleep: {
        durationChange: number;
        qualityChange: number;
      };
      activities: {
        exerciseChange: number;
        meditationChange: number;
        socialChange: number;
      };
    };
  };
  recommendations: {
    articles: Array<{
      title: string;
      type: string;
      duration: string;
      description: string;
      action: {
        label: string;
        url: string;
      };
    }>;
    videos: Array<{
      title: string;
      type: string;
      duration: string;
      description: string;
      action: {
        label: string;
        url: string;
      };
    }>;
    wellness: {
      lifestyle: {
        title: string;
        type: string;
        duration: string;
        description: string;
        steps: string[];
      }[];
      exercises: {
        title: string;
        type: string;
        duration: string;
        description: string;
        routine: string[];
      }[];
      mindfulness: {
        title: string;
        type: string;
        duration: string;
        description: string;
        techniques: string[];
      }[];
      natural_remedies: {
        title: string;
        type: string;
        description: string;
        remedies: string[];
        disclaimer: string;
      }[];
    };
  };
}

export default function HealthTracking() {
  const [activeTab, setActiveTab] = useState("questionnaire");
  const [assessmentType, setAssessmentType] = useState<"text" | "voice">("text");
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    setIsFirstTime(urlParams.get('firstTime') === 'true');
    
    // Handle tab parameter
    const tabParam = urlParams.get('tab');
    
    const userId = localStorage.getItem("mindguard_user_id");
    if (userId) {
      fetchHealthHistory(userId).then((hasData) => {
        // If we have data and a tab parameter, switch to that tab
        if (hasData && tabParam && ['questionnaire', 'insights', 'progress', 'recommendations'].includes(tabParam)) {
          setActiveTab(tabParam);
        }
      });
    }
  }, []);

  const fetchHealthHistory = async (userId: string) => {
    try {
      console.log("Fetching health history for user:", userId);
      const response = await fetch(`${apiUrl}/api/health-tracking/${userId}`);
      console.log("Health history response status:", response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log("No health data found for user");
          setIsFirstTime(true);
          return false;
        }
        throw new Error("Failed to fetch health history");
      }
      
      const data = await response.json();
      console.log("Received health data:", data);
      console.log("Progress data:", data.progress);
      
      setHealthData(data);
      setIsFirstTime(false);
      return true;
    } catch (err) {
      console.error("Error fetching health history:", err);
      setError("Failed to load health history");
      return false;
    }
  };

  const handleQuestionnaireSubmit = async (data: any) => {
    setLoading(true);
    setError("");
    
    try {
      const userId = localStorage.getItem("mindguard_user_id");
      console.log("Submitting questionnaire data:", { ...data, userId });
      
      const response = await fetch(`${apiUrl}/api/health-tracking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId,
          assessmentType: 'text'
        }),
      });

      console.log("Questionnaire submission response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to submit questionnaire: ${response.status}`);
      }

      const result = await response.json();
      console.log("Questionnaire submission result:", result);
      
      // Refresh health data after submission
      if (userId) {
        await fetchHealthHistory(userId);
      } else {
        console.error("No user ID found in localStorage");
        setError("Failed to refresh health data: No user ID found");
      }
      setActiveTab("insights"); // Switch to insights tab after submission
    } catch (err) {
      console.error("Error submitting questionnaire:", err);
      setError(err instanceof Error ? err.message : "Failed to submit questionnaire");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionnaireComplete = () => {
    // Switch to insights tab after questionnaire completion
    setActiveTab("insights");
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2">Health Tracking</h1>
      <p className="text-muted-foreground mb-6">
        {isFirstTime 
          ? "Welcome! Please complete your first mental health assessment"
          : "Monitor your mental health progress and receive personalized insights"}
      </p>

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          console.log(`Tab changing from ${activeTab} to ${value}`);
          setActiveTab(value);
        }} 
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger 
            value="questionnaire"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Questionnaire
          </TabsTrigger>
          <TabsTrigger 
            value="insights"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            disabled={!healthData}
          >
            Insights
          </TabsTrigger>
          <TabsTrigger 
            value="progress"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            disabled={!healthData}
          >
            Progress
          </TabsTrigger>
          <TabsTrigger 
            value="recommendations"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            disabled={!healthData}
          >
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questionnaire">
          <Card>
            <CardHeader>
              <CardTitle>Initial Health Assessment</CardTitle>
              <CardDescription>
                Please complete this assessment to help us understand your mental health needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={assessmentType === "text" ? "default" : "outline"}
                  onClick={() => setAssessmentType("text")}
                >
                  Text Questionnaire
                </Button>
                <Button
                  variant={assessmentType === "voice" ? "default" : "outline"}
                  onClick={() => setAssessmentType("voice")}
                >
                  Voice Assessment
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground mb-6">
                {assessmentType === "text" ? (
                  "Answer a series of questions about your mental health to receive personalized insights."
                ) : assessmentType === "voice" ? (
                  "Speak naturally to our AI assistant for a voice-based mental health assessment."
                ) : null}
              </div>
              
              {assessmentType === "text" ? (
                <HealthQuestionnaire 
                  onSubmit={handleQuestionnaireSubmit} 
                  isLoading={loading}
                  onComplete={handleQuestionnaireComplete}
                />
              ) : assessmentType === "voice" ? (
                <VoiceQuestionnaire 
                  onComplete={handleQuestionnaireComplete}
                />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          {healthData && <HealthInsights insights={healthData.insights} />}
        </TabsContent>

        <TabsContent value="progress">
          {healthData && <ProgressCharts progressData={healthData.progress} />}
        </TabsContent>

        <TabsContent value="recommendations">
          {healthData && <Recommendations recommendations={healthData.recommendations} />}
        </TabsContent>
      </Tabs>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}