"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle, Brain, Heart, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

interface InsightData {
  mainInsight: Record<string, number>;
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
  risk_factors?: string[];
}

interface HealthInsightsProps {
  insights?: InsightData;
}

// Function to get emotion summary from data
const getEmotionSummary = (emotions: { [key: string]: number } | undefined | null) => {
  if (!emotions || typeof emotions !== 'object') {
    return 'No emotion data available';
  }
  
  const sortedEmotions = Object.entries(emotions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  
  return sortedEmotions.length > 0
    ? sortedEmotions.map(([emotion, count]) => 
        `${emotion} (${count} instances)`
      ).join(", ")
    : 'No significant emotions detected';
};

export function HealthInsights({ insights }: HealthInsightsProps) {
  const [emotionData, setEmotionData] = useState<string>('');
  
  useEffect(() => {
    if (insights && insights.mainInsight) {
      setEmotionData(getEmotionSummary(insights.mainInsight));
    } else {
      setEmotionData('No emotion data available');
    }
  }, [insights]);
  
  if (!insights) {
    return (
      <div className="text-center text-muted-foreground">
        Complete the questionnaire to view your insights
      </div>
    );
  }

  const riskData = [
    { name: "Low", value: insights.riskAnalysis?.low || 0, color: "hsl(var(--chart-2))" },
    { name: "Moderate", value: insights.riskAnalysis?.moderate || 0, color: "hsl(var(--chart-4))" },
    { name: "High", value: insights.riskAnalysis?.high || 0, color: "hsl(var(--chart-1))" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Emotional Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {emotionData}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Low Risk:</span>
                <Badge variant="outline" className="bg-green-50">
                  {insights.riskAnalysis?.low || 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Moderate Risk:</span>
                <Badge variant="outline" className="bg-yellow-50">
                  {insights.riskAnalysis?.moderate || 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>High Risk:</span>
                <Badge variant="outline" className="bg-red-50">
                  {insights.riskAnalysis?.high || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Anxiety Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <Badge 
                  variant={insights.anxietyTrend?.status === "increasing" ? "destructive" : "outline"}
                  className="flex items-center gap-1"
                >
                  {insights.anxietyTrend?.status === "increasing" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {insights.anxietyTrend?.status || "stable"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Change:</span>
                <span>{insights.anxietyTrend?.percentage || 0}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {insights.anxietyTrend?.detail || "No details available"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Stress Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <Badge 
                  variant={insights.stressResponse?.status === "improving" ? "outline" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {insights.stressResponse?.status === "improving" ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {insights.stressResponse?.status || "stable"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Change:</span>
                <span>{insights.stressResponse?.percentage || 0}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {insights.stressResponse?.detail || "No details available"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Mood Stability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <Badge 
                  variant={insights.moodStability?.status === "stable" ? "outline" : "secondary"}
                >
                  {insights.moodStability?.status || "unknown"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {insights.moodStability?.detail || "No details available"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Risk Factors & Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.risk_factors && insights.risk_factors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Risk Factors</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {insights.risk_factors.map((factor, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {insights.patterns && insights.patterns.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Identified Patterns</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {insights.patterns.map((pattern, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}