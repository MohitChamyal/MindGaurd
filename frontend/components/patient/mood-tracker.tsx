"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { apiUrl } from "@/lib/config";

// Complete HealthReport interface matching the MongoDB schema
interface HealthReport {
  _id: string;
  userId: string;
  questionnaireData: {
    mood: number;
    anxiety: string;
    sleep_quality: number;
    energy_levels: number;
    physical_symptoms: string;
    concentration: number;
    self_care: string;
    social_interactions: number;
    intrusive_thoughts: string;
    optimism: number;
    stress_factors: string;
    coping_strategies: string;
    social_support: number;
    self_harm: string;
    discuss_professional: string;
  };
  voiceAssessment: boolean;
  raw_responses: any[];
  emotionReport: {
    summary: {
      emotions_count: { [key: string]: number };
      average_confidence: number;
      average_valence: number;
      crisis_count: number;
      risk_factors: string[];
    };
    disorder_indicators: string[];
  };
  progressData: {
    moodData: Array<{
      date: string;
      mood: number;
      anxiety: number;
      stress: number;
      _id: string;
    }>;
    sleepData: Array<{
      date: string;
      hours: number;
      quality: number;
      _id: string;
    }>;
    activityData: Array<{
      date: string;
      exercise: number;
      meditation: number;
      social: number;
      _id: string;
    }>;
  };
  timestamp: string;
}

interface MoodData {
  chartData: Array<{
    date: string;
    mood: number;
    anxiety: number;
  }>;
  insightText: string;
}

export function MoodTracker() {
  const [loading, setLoading] = useState(true);
  const [moodData, setMoodData] = useState<MoodData>({
    chartData: [],
    insightText: ""
  });

  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        const userId = localStorage.getItem('mindguard_user_id');
        if (!userId) {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token') || 
                     localStorage.getItem('mindguard_token') ||
                     sessionStorage.getItem('token');

        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          headers['x-auth-token'] = token;
        }

        console.log('Fetching mood data for user:', userId);
        const response = await fetch(`${apiUrl}/api/health-reports/admin/reports?timeframe=4w`, {
          headers
        });

        if (!response.ok) {
          throw new Error('Failed to fetch mood data');
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        if (data && data.reports) {
          // Filter reports for current user and sort by timestamp
          const userReports = data.reports
            .filter((report: HealthReport) => report.userId === userId)
            .sort((a: HealthReport, b: HealthReport) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

          console.log('Filtered user reports:', userReports.length);

          // Get the most recent 7 entries
          const recentReports = userReports.slice(-7);
          
          // Format data for chart
          const formattedData = recentReports.map((report: HealthReport) => {
            const date = new Date(report.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });

            // Get mood from questionnaire data
            const moodScore = report.questionnaireData.mood * 10; // Scale to 0-100

            // Get anxiety from both questionnaire and emotion report
            const anxietyFromQuestionnaire = report.questionnaireData.anxiety === 'high' ? 100 :
                                           report.questionnaireData.anxiety === 'medium' ? 66 :
                                           report.questionnaireData.anxiety === 'low' ? 33 : 0;

            return {
              date,
              mood: moodScore,
              anxiety: anxietyFromQuestionnaire
            };
          });

          console.log('Formatted chart data:', formattedData);

          // Generate insight text based on trends
          let insightText = "";
          if (formattedData.length >= 2) {
            const firstEntry = formattedData[0];
            const lastEntry = formattedData[formattedData.length - 1];
            
            const moodChange = lastEntry.mood - firstEntry.mood;
            const anxietyChange = lastEntry.anxiety - firstEntry.anxiety;
            
            // Determine the most significant change
            const changes = [
              { type: 'mood', value: Math.abs(moodChange), direction: moodChange > 0 ? 'improved' : 'decreased' },
              { type: 'anxiety', value: Math.abs(anxietyChange), direction: anxietyChange < 0 ? 'improved' : 'increased' }
            ].sort((a, b) => b.value - a.value);

            const mostSignificant = changes[0];
            
            if (mostSignificant.value > 10) { // Only report significant changes
              insightText = `Your ${mostSignificant.type} has ${mostSignificant.direction} by ${Math.round(mostSignificant.value)}% since ${firstEntry.date}`;
            } else {
              insightText = "Your emotional state has remained relatively stable";
            }
          } else {
            insightText = "Track your progress by completing more assessments";
          }

          setMoodData({
            chartData: formattedData,
            insightText
          });
        }
      } catch (error) {
        console.error('Error fetching mood data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoodData();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Mood Trends</CardTitle>
          <CardDescription>Track your emotional patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[180px]">
            <p className="text-muted-foreground">Loading mood data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Mood Trends</CardTitle>
        <CardDescription>Track your emotional patterns over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
              />
              <Line 
                type="monotone" 
                dataKey="mood" 
                name="Mood"
                stroke="#4F46E5"
                strokeWidth={2} 
                dot={{ r: 3, fill: "#4F46E5" }} 
                activeDot={{ r: 5, fill: "#4F46E5" }} 
              />
              <Line 
                type="monotone" 
                dataKey="anxiety" 
                name="Anxiety"
                stroke="#EF4444"
                strokeWidth={2} 
                dot={{ r: 3, fill: "#EF4444" }} 
                activeDot={{ r: 5, fill: "#EF4444" }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center">
          <p className="text-sm text-muted-foreground">
            {moodData.insightText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}