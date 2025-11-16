"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiUrl } from '@/lib/config';

interface HealthReport {
  timestamp: string;
  mood: number;
  energy_levels: number;
  sleep_quality: number;
  optimism: number;
}

interface ScoreData {
  currentScore: number;
  weeklyAverage: number;
  change: number;
  dailyScores: Array<{day: string; score: number}>;
}

export function WellnessScore() {
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState<ScoreData>({
    currentScore: 0,
    weeklyAverage: 0,
    change: 0,
    dailyScores: []
  });

  useEffect(() => {
    const fetchWellnessData = async () => {
      try {
        const userId = localStorage.getItem('mindguard_user_id');
        if (!userId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${apiUrl}/api/health-tracking/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch wellness data');
        }

        const data = await response.json();
        
        if (data && data.healthreports && data.healthreports.length > 0) {
          // Calculate wellness score based on the latest health report
          // Wellness score is an average of mood, energy, sleep quality, and optimism
          const latest = data.healthreports[0];
          const currentScore = Math.round((
            (latest.mood || 0) + 
            (latest.energy_levels || 0) + 
            (latest.sleep_quality || 0) + 
            (latest.optimism || 0)
          ) / 4);
          
          // Calculate weekly average from available data points
          const recentReports = data.healthreports.slice(0, Math.min(7, data.healthreports.length));
          const weeklyScores = recentReports.map((report: HealthReport) => 
            Math.round((
              (report.mood || 0) + 
              (report.energy_levels || 0) + 
              (report.sleep_quality || 0) + 
              (report.optimism || 0)
            ) / 4)
          );
          
          const weeklyAverage = Math.round(
            weeklyScores.reduce((sum: number, score: number) => sum + score, 0) / weeklyScores.length
          );
          
          // Calculate change from previous assessment
          let change = 0;
          if (data.healthreports.length > 1) {
            const previousReport = data.healthreports[1];
            const previousScore = Math.round((
              (previousReport.mood || 0) + 
              (previousReport.energy_levels || 0) + 
              (previousReport.sleep_quality || 0) + 
              (previousReport.optimism || 0)
            ) / 4);
            change = currentScore - previousScore;
          }

          // Format data for chart from oldest to newest (left to right)
          // First reverse the reports array to get oldest first
          const orderedReports = [...recentReports].reverse();
          
          const dailyScores = orderedReports.map((report: HealthReport, index: number) => {
            const sessionNumber = index + 1; // Start with Session 1 (oldest)
            
            return {
              day: `Session ${sessionNumber}`,
              score: Math.round((
                (report.mood || 0) + 
                (report.energy_levels || 0) + 
                (report.sleep_quality || 0) + 
                (report.optimism || 0)
              ) / 4)
            };
          });

          setScoreData({
            currentScore,
            weeklyAverage,
            change,
            dailyScores
          });
        }
      } catch (error) {
        console.error('Error fetching wellness data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWellnessData();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Wellness Score</CardTitle>
          <CardDescription>Your overall mental health score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[180px]">
            <p className="text-muted-foreground">Loading wellness data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Wellness Score</CardTitle>
        <CardDescription>Your overall mental health score</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-4xl font-bold">{scoreData.currentScore}</p>
            <p className="text-xs text-muted-foreground">
              {scoreData.change > 0 ? "+" : ""}{scoreData.change} from previous assessment
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Average Score</p>
            <p className="text-2xl font-semibold">{scoreData.weeklyAverage}</p>
          </div>
        </div>
        <div className="h-[180px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scoreData.dailyScores} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wellnessGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
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
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--chart-1))" 
                fillOpacity={1} 
                fill="url(#wellnessGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}