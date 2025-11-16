'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Download, MessageSquare, ThumbsUp, AlertTriangle, Clock, Activity, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

async function fetchAnalytics(timeframe: string) {
  try {
    const response = await fetch(`/api/analytics?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

export default function AIAnalyticsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("4w");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchAnalytics(timeRange);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
        setIsMounted(true);
      }
    };

    loadData();
  }, [timeRange]);

  if (!isMounted || loading) {
    return <div className="flex justify-center items-center h-48">Loading analytics data...</div>;
  }

  // Default values in case API data is not available
  const overview = analyticsData?.overview || {
    totalInteractions: 0,
    totalChats: 0,
    totalUsers: 0,
    flaggedInteractions: 0
  };

  // Format sentiment data for visualization
  const sentimentData = analyticsData?.sentiment?.map((item: any) => {
    const name = item._id || 'unknown';
    let color = '#6b7280'; // Default gray for unknown

    if (name.includes('positive') || name === 'happy' || name === 'joyful') {
      color = '#10b981'; // Green for positive
    } else if (name.includes('negative') || name === 'sad' || name === 'angry') {
      color = '#ef4444'; // Red for negative
    }

    return { name, value: item.count, color };
  }) || [];

  // Format topic data for visualization
  const topicData = analyticsData?.topics?.map((item: any) => ({
    name: item._id || 'Unknown',
    count: item.count
  })) || [];

  // Format daily data for visualization
  const dailyData = analyticsData?.dailyStats?.map((item: any) => {
    const date = new Date(Date.UTC(item._id.year, item._id.month - 1, item._id.day));
    return {
      date: date.toISOString().split('T')[0],
      count: item.count
    };
  }) || [];

  // Format recent interactions with more detailed information
  const recentInteractions = analyticsData?.recentInteractions?.map((item: any) => {
    const sentiment = item.metadata?.sentiment || 'neutral';
    const topic = item.metadata?.topic || item.interactionType || 'conversation';
    const dateStr = formatDistanceToNow(new Date(item.startTime), { addSuffix: true });
    
    // Get message content if available
    const lastMessage = item.chatHistory && item.chatHistory.length > 0 
      ? item.chatHistory[0].content
      : null;
    
    // Get first questionnaire response if available
    const firstQuestion = item.questionnaireResponses && item.questionnaireResponses.length > 0
      ? {
          question: item.questionnaireResponses[0].questionText,
          response: item.questionnaireResponses[0].response
        }
      : null;
    
    // Calculate interaction duration in seconds if both timestamps exist
    let duration = null;
    if (item.duration) {
      duration = Math.round(item.duration / 1000); // Convert ms to seconds
    }
    
    return {
      id: item._id,
      userId: item.userId,
      user: item.userName || `User #${item.userId.substring(0, 5)}`,
      topic: topic,
      sentiment: sentiment,
      timestamp: dateStr,
      flagged: item.metadata?.isFlagged || false,
      lastMessage: lastMessage,
      firstQuestion: firstQuestion,
      duration: duration,
      interactionType: item.interactionType
    };
  }) || [];

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  const handleDownload = () => {
    if (!analyticsData) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analyticsData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">AI Analytics</h1>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            {/* <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger> */}
            {/* <SelectContent>
              <SelectItem value="1w">Last week</SelectItem>
              <SelectItem value="2w">Last 2 weeks</SelectItem>
              <SelectItem value="4w">Last 4 weeks</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent> */}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalInteractions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              In the selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalChats.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Chat messages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Interactions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.flaggedInteractions}</div>
            <p className="text-xs text-muted-foreground">
              Need review
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="topics">Common Topics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Interaction Volume</CardTitle>
                <CardDescription>
                  Daily interactions over time
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
                      formatter={(value: any) => [value, "Interactions"]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" name="Interactions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
                <CardDescription>
                  Overall sentiment of user interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-[250px] h-[250px]">
                  {sentimentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {sentimentData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No sentiment data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
              <CardDescription>
                Latest user conversations with the AI chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentInteractions.length > 0 ? (
                <div className="space-y-6">
                  {recentInteractions.map((interaction: {
                    id: string;
                    user: string;
                    timestamp: string;
                    sentiment: string;
                    flagged: boolean;
                    interactionType: string;
                    topic: string;
                    duration: number | null;
                    lastMessage: string | null;
                    firstQuestion: { question: string; response: string | number } | null;
                  }) => (
                    <div 
                      key={interaction.id} 
                      className="border rounded-lg p-4 transition-all hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{interaction.user}</p>
                            <p className="text-xs text-muted-foreground">{interaction.timestamp}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            interaction.sentiment.includes('positive') ? 'default' : 
                            interaction.sentiment.includes('neutral') ? 'secondary' : 
                            'destructive'
                          }>
                            {interaction.sentiment}
                          </Badge>
                          {interaction.flagged && (
                            <Badge variant="destructive">Flagged</Badge>
                          )}
                          <Badge variant="outline">{interaction.interactionType}</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Topic:</span>
                          <span className="text-sm">{interaction.topic}</span>
                        </div>
                        
                        {interaction.duration !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Duration:</span>
                            <span className="text-sm">
                              {interaction.duration > 60 
                                ? `${Math.floor(interaction.duration / 60)} min ${interaction.duration % 60} sec` 
                                : `${interaction.duration} sec`}
                            </span>
                          </div>
                        )}
                        
                        {interaction.lastMessage && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Last message:</p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{interaction.lastMessage}</p>
                          </div>
                        )}
                        
                        {interaction.firstQuestion && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Assessment question:</p>
                            <p className="text-sm mt-1">{interaction.firstQuestion.question}</p>
                            <p className="text-sm text-muted-foreground mt-1">Response: {interaction.firstQuestion.response.toString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No recent interactions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of user sentiment during AI interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Sentiment analysis helps identify emotional patterns in user conversations, allowing for better response optimization and crisis detection.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-2">Sentiment Distribution</h3>
                  <div className="h-[300px]">
                    {sentimentData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {sentimentData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No sentiment data available</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Key Insights</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                      <p className="text-sm">Positive sentiment indicates effective AI support</p>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500 mt-1.5"></div>
                      <p className="text-sm">Neutral sentiment typically occurs during information gathering</p>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                      <p className="text-sm">Negative sentiment triggers are flagged for review</p>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                      <p className="text-sm">Monitor trends over time to improve AI responses</p>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common User Topics</CardTitle>
              <CardDescription>
                Most frequently discussed mental health topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {topicData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topicData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Conversations" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No topic data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}