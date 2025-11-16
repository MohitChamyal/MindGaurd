"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ProgressData {
  moodData: Array<{
    date: string;
    mood: number;
    anxiety: number;
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
}

interface ProgressChartsProps {
  progressData?: ProgressData;
}

export function ProgressCharts({ progressData }: ProgressChartsProps) {
  if (!progressData || !progressData.moodData || !progressData.sleepData || !progressData.activityData) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No progress data available. Complete the questionnaire to view your progress.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const formatChange = (value: number | undefined) => {
    if (value === undefined) return '0%';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue > 0 ? `+${numValue}%` : `${numValue}%`;
  };

  // Sort data by date (oldest to newest)
  const sortByDate = (data: any[]) => {
    return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Prepare sorted data
  const sortedMoodData = sortByDate(progressData.moodData);
  const sortedSleepData = sortByDate(progressData.sleepData);
  const sortedActivityData = sortByDate(progressData.activityData);

  const summary = progressData.summary || {
    mood: { change: 0 },
    anxiety: { change: 0 },
    sleep: {
      durationChange: 0,
      qualityChange: 0
    },
    activities: {
      exerciseChange: 0,
      meditationChange: 0,
      socialChange: 0
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mood & Anxiety Trends</CardTitle>
            <CardDescription>
              Track your emotional well-being over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedMoodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    type="category"
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={[0, 10]} />
                  <Tooltip
                    labelFormatter={(label) => formatDate(label as string)}
                    formatter={(value: number) => [value.toFixed(1), ""]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="#4F46E5"
                    name="Mood"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#4F46E5" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="anxiety"
                    stroke="#EF4444"
                    name="Anxiety"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#EF4444" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Mood Change</div>
                <div className={summary.mood.change >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatChange(summary.mood.change)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Anxiety Change</div>
                <div className={summary.anxiety.change <= 0 ? "text-green-600" : "text-red-600"}>
                  {formatChange(summary.anxiety.change)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep Patterns</CardTitle>
            <CardDescription>
              Monitor your sleep quality and duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedSleepData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    type="category"
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={[0, 10]} />
                  <Tooltip
                    labelFormatter={(label) => formatDate(label as string)}
                    formatter={(value: number) => [value.toFixed(1), ""]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#0EA5E9"
                    name="Hours"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#0EA5E9" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="#8B5CF6"
                    name="Quality"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#8B5CF6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Duration Change</div>
                <div className={summary.sleep.durationChange >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatChange(summary.sleep.durationChange)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Quality Change</div>
                <div className={summary.sleep.qualityChange >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatChange(summary.sleep.qualityChange)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Tracking</CardTitle>
          <CardDescription>
            Monitor your engagement in various activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  type="category"
                  interval="preserveStartEnd"
                />
                <YAxis domain={[0, 10]} />
                <Tooltip
                  labelFormatter={(label) => formatDate(label as string)}
                  formatter={(value: number) => [value.toFixed(1), ""]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="exercise"
                  stroke="#10B981"
                  name="Exercise"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#10B981" }}
                />
                <Line
                  type="monotone"
                  dataKey="meditation"
                  stroke="#EC4899"
                  name="Meditation"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#EC4899" }}
                />
                <Line
                  type="monotone"
                  dataKey="social"
                  stroke="#6366F1"
                  name="Social"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#6366F1" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Exercise Change</div>
              <div className={summary.activities.exerciseChange >= 0 ? "text-green-600" : "text-red-600"}>
                {formatChange(summary.activities.exerciseChange)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Meditation Change</div>
              <div className={summary.activities.meditationChange >= 0 ? "text-green-600" : "text-red-600"}>
                {formatChange(summary.activities.meditationChange)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Social Change</div>
              <div className={summary.activities.socialChange >= 0 ? "text-green-600" : "text-red-600"}>
                {formatChange(summary.activities.socialChange)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}