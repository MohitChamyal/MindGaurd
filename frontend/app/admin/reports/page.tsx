'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Download, Brain, Activity, Users, CalendarDays, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiUrl } from '@/lib/config';

// Define emotion colors
const EMOTION_COLORS = {
  joy: '#10b981', // Green for positive emotions
  optimism: '#3b82f6', // Blue for optimism
  calmness: '#8b5cf6', // Purple for calmness
  anxiety: '#ef4444', // Red for anxiety
  stress: '#f59e0b', // Orange for stress
  other: '#6b7280', // Gray for other
};

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
}

interface ReportStats {
  totalReports: number;
  uniqueUsers: number;
  averageEmotionalValence: number;
  totalCrisisCount: number;
  emotionBreakdown: EmotionBreakdown[];
  dailyActivity: DailyActivity[];
}

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
  username?: string;
}

interface EmotionData {
  name: string;
  count: number;
  confidence: number;
  fill: string;
}

async function fetchReportAnalytics(timeframe: string) {
  try {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('mindguard_token') ||
                  sessionStorage.getItem('token');
    
    console.log('Token found:', !!token);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-auth-token'] = token;
    }
    
    console.log('Fetching reports with timeframe:', timeframe);
    
    const response = await fetch(`${apiUrl}/api/health-reports/admin/reports?timeframe=${timeframe}`, {
      headers
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch reports: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Received data:', data);
    
    const stats = calculateStatsFromReports(data.reports);
    console.log('Calculated stats:', stats);
    
    return {
      reports: data.reports,
      stats
    };
  } catch (error) {
    console.error('Error fetching report analytics:', error);
    return {
      reports: [],
      stats: {
        totalReports: 0,
        uniqueUsers: 0,
        averageEmotionalValence: 0,
        totalCrisisCount: 0,
        emotionBreakdown: [],
        dailyActivity: []
      }
    };
  }
}

function calculateStatsFromReports(reports: HealthReport[]): ReportStats {
  console.log('Calculating stats from reports:', reports?.length || 0);
  
  if (!Array.isArray(reports) || reports.length === 0) {
    console.log('No reports to process');
    return {
      totalReports: 0,
      uniqueUsers: 0,
      averageEmotionalValence: 0,
      totalCrisisCount: 0,
      emotionBreakdown: [],
      dailyActivity: []
    };
  }
  
  const totalReports = reports.length;
  const userIds = new Set(reports.map(report => report.userId));
  const uniqueUsers = userIds.size;
  
  console.log('Processing reports:', {
    totalReports,
    uniqueUsers
  });
  
  // Calculate average emotional valence and total crisis count
  let totalValence = 0;
  let totalCrisisCount = 0;
  
  // Emotion breakdown
  const emotionCounts = new Map();
  const emotionConfidence = new Map();
  
  reports.forEach((report, index) => {
    if (report.emotionReport?.summary) {
      totalValence += report.emotionReport.summary.average_valence || 0;
      totalCrisisCount += report.emotionReport.summary.crisis_count || 0;
      
      // Process emotions
      const emotions = report.emotionReport.summary.emotions_count || {};
      console.log(`Report ${index} emotions:`, emotions);
      
      Object.entries(emotions).forEach(([emotion, count]) => {
        emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + count);
        emotionConfidence.set(emotion, (emotionConfidence.get(emotion) || 0) + (report.emotionReport.summary.average_confidence || 0));
      });
    }
  });
  
  const averageEmotionalValence = totalValence / totalReports;
  
  console.log('Emotion processing results:', {
    totalValence,
    averageEmotionalValence,
    totalCrisisCount,
    emotionCounts: Object.fromEntries(emotionCounts),
    emotionConfidence: Object.fromEntries(emotionConfidence)
  });

  // Format emotion breakdown
  const emotionBreakdown = Array.from(emotionCounts.entries()).map(([type, count]) => ({
    type,
    count: count as number,
    confidence: (emotionConfidence.get(type) || 0) / totalReports
  }));
  
  // Calculate daily activity
  const dailyActivityMap = new Map();
  
  reports.forEach(report => {
    const date = new Date(report.timestamp).toISOString().split('T')[0];
    
    if (!dailyActivityMap.has(date)) {
      dailyActivityMap.set(date, {
        date,
        mood: 0,
        anxiety: 0,
        stress: 0,
        count: 0
      });
    }
    
    const day = dailyActivityMap.get(date);
    day.mood += report.questionnaireData.mood || 0;
    day.anxiety += report.questionnaireData.anxiety === 'high' ? 3 : 
                   report.questionnaireData.anxiety === 'medium' ? 2 : 1;
    day.stress += report.questionnaireData.stress_factors ? 2 : 1;
    day.count += 1;
  });
  
  // Average the daily scores
  const dailyActivity = Array.from(dailyActivityMap.values())
    .map(day => ({
      date: day.date,
      mood: day.mood / day.count,
      anxiety: day.anxiety / day.count,
      stress: day.stress / day.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  console.log('Daily activity:', dailyActivity);
  
  return {
    totalReports,
    uniqueUsers,
    averageEmotionalValence,
    totalCrisisCount,
    emotionBreakdown,
    dailyActivity
  };
}

export default function ReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("4w");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchReportAnalytics(timeRange);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error loading report analytics:', error);
        setAnalyticsData({
          reports: [],
          stats: {
            totalReports: 0,
            uniqueUsers: 0,
            averageEmotionalValence: 0,
            totalCrisisCount: 0,
            emotionBreakdown: [],
            dailyActivity: []
          }
        });
      } finally {
        setLoading(false);
        setIsMounted(true);
      }
    };

    loadData();
  }, [timeRange]);

  if (!isMounted || loading) {
    return <div className="flex justify-center items-center h-48">Loading report data...</div>;
  }

  // Format emotion data for visualization
  const emotionData = analyticsData?.stats?.emotionBreakdown?.map((item: EmotionBreakdown) => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    count: item.count,
    confidence: Math.round(item.confidence * 100),
    fill: EMOTION_COLORS[item.type as keyof typeof EMOTION_COLORS] || EMOTION_COLORS.other
  })) || [];

  // Format daily activity data
  const dailyData = analyticsData?.stats?.dailyActivity || [];

  // Format reports for the table
  const reports = analyticsData?.reports || [];

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  const handleDownload = () => {
    if (!analyticsData) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analyticsData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `health_reports_${timeRange}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Calculate overview metrics
  const overview = {
    totalReports: analyticsData?.stats?.totalReports || 0,
    uniqueUsers: analyticsData?.stats?.uniqueUsers || 0,
    averageValence: analyticsData?.stats?.averageEmotionalValence || 0,
    crisisCount: analyticsData?.stats?.totalCrisisCount || 0
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Health Reports Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalReports.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              In the selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Unique participants
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emotional Valence</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.averageValence.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Average emotional state
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crisis Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.crisisCount}</div>
            <p className="text-xs text-muted-foreground">
              Total crisis indicators
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emotions">Emotional Analysis</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Daily Mental Health Trends</CardTitle>
                <CardDescription>
                  Mood, anxiety, and stress levels over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [Number(value).toFixed(2), "Level"]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="mood" stroke="#10b981" name="Mood" />
                    <Line type="monotone" dataKey="anxiety" stroke="#ef4444" name="Anxiety" />
                    <Line type="monotone" dataKey="stress" stroke="#f59e0b" name="Stress" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Emotion Distribution</CardTitle>
                <CardDescription>
                  Breakdown of reported emotions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-[250px] h-[250px]">
                  {emotionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={emotionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, percent }) => {
                            const label = `${name} ${(percent * 100).toFixed(0)}%`;
                            return label.length > 15 ? `${name.slice(0, 12)}... ${(percent * 100).toFixed(0)}%` : label;
                          }}
                        >
                          {emotionData.map((entry: EmotionData, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, name: any, props: any) => [value, props.payload.name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No emotion data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="emotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emotional Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of emotional states and confidence levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Emotional analysis helps identify patterns in mental health states and potential areas requiring attention.
              </p>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Emotion Frequency</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={emotionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Occurrences" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Detection Confidence</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={emotionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="confidence" name="Confidence %" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Emotional State Analysis</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Emotion</TableHead>
                        <TableHead>Occurrences</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Relative Frequency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emotionData.map((emotion: EmotionData) => {
                        const frequency = (emotion.count / overview.totalReports * 100).toFixed(1);
                        
                        return (
                          <TableRow key={emotion.name}>
                            <TableCell className="font-medium">{emotion.name}</TableCell>
                            <TableCell>{emotion.count}</TableCell>
                            <TableCell>{emotion.confidence}%</TableCell>
                            <TableCell>{frequency}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                Complete history of health reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Mood</TableHead>
                    <TableHead>Anxiety</TableHead>
                    <TableHead>Sleep</TableHead>
                    <TableHead>Crisis Risk</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length > 0 ? (
                    reports.map((report: HealthReport) => (
                      <TableRow key={report._id}>
                        <TableCell className="font-medium">
                          {report.username || `User #${report.userId.substring(0,5)}`}
                        </TableCell>
                        <TableCell>{report.questionnaireData.mood}/10</TableCell>
                        <TableCell>{report.questionnaireData.anxiety}</TableCell>
                        <TableCell>{report.questionnaireData.sleep_quality}/10</TableCell>
                        <TableCell>
                          <Badge variant={
                            report.emotionReport?.summary?.crisis_count > 0 ? 'destructive' : 
                            report.emotionReport?.summary?.risk_factors?.length > 0 ? 'secondary' : 
                            'default'
                          }>
                            {report.emotionReport?.summary?.crisis_count > 0 ? 'High' :
                             report.emotionReport?.summary?.risk_factors?.length > 0 ? 'Medium' :
                             'Low'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(report.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <p className="text-muted-foreground">No report history available</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 