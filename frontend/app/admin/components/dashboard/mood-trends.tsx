'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiUrl } from "@/lib/config";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

interface EmotionBreakdown {
  type: string;
  count: number;
  confidence: number;
}

interface DailyActivity {
  date: string;
  mood: number;
  anxiety: number;
  stress: number;
  reportCount: number;
}

interface ApiResponse {
  reports: any[];
  stats: {
    emotionBreakdown: EmotionBreakdown[];
    dailyActivity: DailyActivity[];
    totalReports: number;
    uniqueUsers: number;
    totalCrisisCount: number;
  };
}

export function MoodTrends() {
  const [loading, setLoading] = useState(true);
  const [emotionData, setEmotionData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiUrl}/api/health-reports/admin/reports?timeframe=4w`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data: ApiResponse = await response.json();
        console.log("Received data:", data);

        // Group similar emotions together
        const emotionGroups = {
          Joy: ['joyful', 'optimistic', 'positive', 'energetic', 'relaxed', 'calm'],
          Anxiety: ['anxious', 'panicked', 'uneasy', 'worried', 'uncertain', 'overwhelmed'],
          Stress: ['stressed', 'depressed', 'sad', 'hopeless', 'discouraged', 'negative']
        };

        // Process daily emotion data from the actual API response
        const dailyActivityData = data.stats.dailyActivity;
        const emotionBreakdown = data.stats.emotionBreakdown;
        
        // Create a map of dates to emotion counts
        const dateEmotionMap = new Map();
        
        // Initialize the dateEmotionMap with all dates from dailyActivityData
        dailyActivityData.forEach(day => {
          const formattedDate = new Date(day.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          
          dateEmotionMap.set(formattedDate, {
            date: formattedDate,
            Joy: 0,
            Anxiety: 0,
            Stress: 0,
            reportCount: day.reportCount
          });
        });
        
        // Distribute emotion counts by date based on the report count proportions
        // Since the API doesn't provide per-day emotion breakdowns, we'll distribute based on report counts
        if (dailyActivityData.length > 0) {
          const totalReports = dailyActivityData.reduce((sum, day) => sum + day.reportCount, 0);
          
          dailyActivityData.forEach(day => {
            const formattedDate = new Date(day.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
            
            const dayData = dateEmotionMap.get(formattedDate);
            const dayProportion = day.reportCount / totalReports;
            
            // Calculate emotion counts for this day based on the proportion of reports
            Object.entries(emotionGroups).forEach(([category, emotions]) => {
              const categoryCount = emotionBreakdown
                .filter(e => emotions.includes(e.type))
                .reduce((sum, e) => sum + e.count, 0);
                
              // Assign a proportional count of emotions to this day
              dayData[category] = Math.round(categoryCount * dayProportion);
            });
            
            dateEmotionMap.set(formattedDate, dayData);
          });
        }
        
        // Convert the map back to an array for the chart
        const chartData = Array.from(dateEmotionMap.values());
        
        console.log("Processed chart data:", chartData);
        setEmotionData(chartData);
      } catch (error) {
        console.error("Error fetching emotion data:", error);
        setEmotionData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={emotionData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis 
                tickFormatter={(value) => `${Math.round(value)}`} 
                label={{ value: 'Occurrences', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip 
                formatter={(value: number) => [value, 'occurrences']} 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Bar dataKey="Joy" fill="#4CAF50" />
              <Bar dataKey="Anxiety" fill="#FF9800" />
              <Bar dataKey="Stress" fill="#F44336" />
            </BarChart>
          </ResponsiveContainer>
        </div>
  );
}