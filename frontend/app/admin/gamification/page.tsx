'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Gamepad2, Clock, Activity, Users, CalendarDays, Hash, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiUrl } from '@/lib/config';

// Define game type colors
const GAME_COLORS = {
  notes: '#10b981', // Green for notes
  puzzle: '#3b82f6', // Blue for puzzle
  breathing: '#8b5cf6', // Purple for breathing
  other: '#6b7280', // Gray for other
};

// Define game types with icons
const GAME_TYPES: { [key: string]: string } = {
  notes: '📝 Memory Notes',
  puzzle: '🧩 Puzzle Game',
  breathing: '🧘 Breathing Exercise',
  other: '🎮 Other Games',
};

interface GameTypeBreakdown {
  type: string;
  count: number;
  totalDuration: number;
}

interface DailyActivity {
  date: string;
  notes: number;
  puzzle: number;
  breathing: number;
  other: number;
}

interface GameStats {
  totalGames: number;
  uniqueUsers: number;
  totalDuration: number;
  gameTypeBreakdown: GameTypeBreakdown[];
  dailyActivity: DailyActivity[];
}

interface MongoId {
  $oid?: string;
  [key: string]: any;
}

interface MongoDate {
  $date?: string;
  [key: string]: any;
}

interface GameLogEntry {
  _id: any;
  userId: string;
  gameType: string;
  duration: number;
  completionStatus: string;
  score: number;
  notes?: string;
  metadata?: any;
  createdAt: any;
  username?: string;
}

async function fetchGameAnalytics(timeframe: string) {
  try {
    // Get authentication token
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('mindguard_token') ||
                  sessionStorage.getItem('token');
    
    console.log(`Fetching game analytics for timeframe: ${timeframe}`);
    console.log(`API URL: ${apiUrl}`);
    
    // Set up headers with auth token
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add both authorization header formats
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-auth-token'] = token;
    } else {
      console.warn('No authentication token found');
    }
    
    // Fetch logs with proper authentication
    console.log(`Fetching from: ${apiUrl}/api/game-logs/admin/logs?timeframe=${timeframe}`);
    const logsResponse = await fetch(`${apiUrl}/api/game-logs/admin/logs?timeframe=${timeframe}`, {
      headers
    });
    console.log('Logs response status:', logsResponse.status);
    
    // Handle errors
    let gameLogs = [];
    
    if (logsResponse.ok) {
      gameLogs = await logsResponse.json();
    } else {
      console.error('Failed to fetch game logs:', logsResponse.status);
    }
    
    // Process MongoDB data format if needed
    const processedLogs = Array.isArray(gameLogs) ? gameLogs.map(log => {
      const processedLog = {...log};
      
      // Handle MongoDB date format conversion if needed
      if (processedLog.createdAt && typeof processedLog.createdAt === 'object' && processedLog.createdAt.$date) {
        processedLog.createdAt = processedLog.createdAt.$date;
      }
      
      // Handle MongoDB ObjectId format if needed
      if (processedLog._id && typeof processedLog._id === 'object' && processedLog._id.$oid) {
        processedLog._id = processedLog._id.$oid;
      }
      
      return processedLog;
    }) : [];
    
    console.log('API Response - Logs:', processedLogs);
    
    // Calculate stats directly from the logs instead of making a separate API call
    const stats = calculateStatsFromLogs(processedLogs);
    console.log('Calculated Stats:', stats);
    
    return {
      logs: processedLogs,
      stats
    };
  } catch (error) {
    console.error('Error fetching game analytics:', error);
    return {
      logs: [],
      stats: {
        totalGames: 0,
        uniqueUsers: 0,
        totalDuration: 0,
        gameTypeBreakdown: [],
        dailyActivity: []
      }
    };
  }
}

// Calculate game statistics directly from logs data
function calculateStatsFromLogs(logs: any[]): GameStats {
  if (!Array.isArray(logs) || logs.length === 0) {
    return {
      totalGames: 0,
      uniqueUsers: 0,
      totalDuration: 0,
      gameTypeBreakdown: [],
      dailyActivity: []
    };
  }
  
  // Calculate total games
  const totalGames = logs.length;
  
  // Get unique users
  const userIds = new Set(logs.map(log => log.userId));
  const uniqueUsers = userIds.size;
  
  // Calculate total duration
  const totalDuration = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
  
  // Game type breakdown
  const gameTypeMap = new Map();
  logs.forEach(log => {
    const type = log.gameType || 'other';
    if (!gameTypeMap.has(type)) {
      gameTypeMap.set(type, { count: 0, totalDuration: 0 });
    }
    
    const gameTypeData = gameTypeMap.get(type);
    gameTypeData.count += 1;
    gameTypeData.totalDuration += (log.duration || 0);
  });
  
  const gameTypeBreakdown = Array.from(gameTypeMap.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    totalDuration: data.totalDuration
  }));
  
  // Calculate daily activity
  const dailyActivityMap = new Map();
  
  logs.forEach(log => {
    // Ensure createdAt is in proper format
    let date;
    if (typeof log.createdAt === 'string') {
      date = log.createdAt.split('T')[0]; // Extract YYYY-MM-DD
    } else if (log.createdAt instanceof Date) {
      date = log.createdAt.toISOString().split('T')[0];
    } else {
      date = new Date().toISOString().split('T')[0]; // Fallback to today
    }
    
    if (!dailyActivityMap.has(date)) {
      dailyActivityMap.set(date, {
        date,
        notes: 0,
        puzzle: 0,
        breathing: 0,
        other: 0
      });
    }
    
    const day = dailyActivityMap.get(date);
    const gameType = log.gameType || 'other';
    
    if (gameType === 'notes' || gameType === 'puzzle' || gameType === 'breathing') {
      day[gameType] += 1;
    } else {
      day.other += 1;
    }
  });
  
  const dailyActivity = Array.from(dailyActivityMap.values())
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date ascending
  
  return {
    totalGames,
    uniqueUsers,
    totalDuration,
    gameTypeBreakdown,
    dailyActivity
  };
}

export default function GamificationPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("4w");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch game analytics data
        const data = await fetchGameAnalytics(timeRange);
        console.log('API Response:', data);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error loading gamification analytics:', error);
        // Set empty data on error
        setAnalyticsData({
          logs: [],
          stats: {
            totalGames: 0,
            uniqueUsers: 0,
            totalDuration: 0,
            gameTypeBreakdown: [],
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
    return <div className="flex justify-center items-center h-48">Loading gamification data...</div>;
  }

  // Format game data for visualization
  const gameTypeData = analyticsData?.stats?.gameTypeBreakdown?.map((item: any) => {
    // Handle MongoDB format if needed
    const itemType = item.type || item._id || '';
    const itemCount = typeof item.count === 'number' ? item.count : 0;
    const itemDuration = typeof item.totalDuration === 'number' ? item.totalDuration : 0;
    
    return {
      name: GAME_TYPES[itemType] || itemType,
      count: itemCount,
      duration: Math.ceil(itemDuration / 60), // Convert seconds to minutes
      fill: GAME_COLORS[itemType as keyof typeof GAME_COLORS] || '#6b7280'
    };
  }) || [];

  // Format daily activity data
  const dailyData = analyticsData?.stats?.dailyActivity?.map((item: any) => {
    // Handle MongoDB format where date might be in _id field
    const itemDate = item.date || item._id || '';
    
    return {
      date: itemDate,
      notes: item.notes || 0,
      puzzle: item.puzzle || 0,
      breathing: item.breathing || 0,
      other: item.other || 0,
      total: (item.notes || 0) + (item.puzzle || 0) + (item.breathing || 0) + (item.other || 0)
    };
  }) || [];

  // Format logs for the table
  const gameLogs = analyticsData?.logs || [];

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  // Calculate total metrics
  const overview = {
    totalGames: analyticsData?.stats?.totalGames || 0,
    uniqueUsers: analyticsData?.stats?.uniqueUsers || 0,
    totalDuration: analyticsData?.stats?.totalDuration || 0,
    completionRate: gameLogs.filter((log: any) => log.completionStatus === 'completed').length / (gameLogs.length || 1) * 100
  };

  // Format duration in minutes
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gamification Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Game Sessions</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalGames.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              In the selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Unique users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Play Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(overview.totalDuration / 60)} mins</div>
            <p className="text-xs text-muted-foreground">
              Across all games
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Games completed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="games">Game Types</TabsTrigger>
          <TabsTrigger value="history">Game History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Daily Game Activity</CardTitle>
                <CardDescription>
                  Daily game sessions over time
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
                      formatter={(value: any) => [value, "Sessions"]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#000000" name="Total" />
                    <Line type="monotone" dataKey="notes" stroke={GAME_COLORS.notes} name="Notes" />
                    <Line type="monotone" dataKey="puzzle" stroke={GAME_COLORS.puzzle} name="Puzzle" />
                    <Line type="monotone" dataKey="breathing" stroke={GAME_COLORS.breathing} name="Breathing" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Game Distribution</CardTitle>
                <CardDescription>
                  Breakdown of game type usage
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-[250px] h-[250px]">
                  {gameTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={gameTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                        >
                          {gameTypeData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, name: any, props: any) => [value, props.payload.name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No game data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Game Sessions</CardTitle>
              <CardDescription>
                Latest user interactions with gamification features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gameLogs.length > 0 ? (
                <div className="space-y-6">
                  {gameLogs.slice(0, 5).map((log: any) => (
                    <div 
                      key={log._id} 
                      className="border rounded-lg p-4 transition-all hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Gamepad2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{log.username || `User #${log.userId?.substring(0,5)}`}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            log.completionStatus === 'completed' ? 'default' : 
                            log.completionStatus === 'in-progress' ? 'secondary' : 
                            'destructive'
                          }>
                            {log.completionStatus}
                          </Badge>
                          <Badge variant="outline">{GAME_TYPES[log.gameType] || log.gameType}</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Duration:</span>
                          <span className="text-sm">{formatDuration(log.duration)}</span>
                        </div>
                        
                        {log.score > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Score:</span>
                            <span className="text-sm">{log.score.toLocaleString()}</span>
                          </div>
                        )}
                        
                        {log.gameType === 'notes' && log.metadata && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Memory Note:</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs bg-muted px-2 py-1 rounded-md">
                                {log.metadata.wordCount || 0} words
                              </span>
                              <span className="text-xs bg-muted px-2 py-1 rounded-md">
                                {log.metadata.characterCount || 0} characters
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No recent game sessions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Type Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of game usage and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Game analytics help identify which therapeutic activities are most engaging and effective for users, allowing for better gamification optimization.
              </p>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Game Sessions by Type</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gameTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Sessions" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Time Spent by Game Type (minutes)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gameTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="duration" name="Minutes" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Game Usage Comparison</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game Type</TableHead>
                        <TableHead>Total Sessions</TableHead>
                        <TableHead>Average Duration</TableHead>
                        <TableHead>Completion Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameTypeData.map((game: any) => {
                        // Find logs of this game type
                        const relevantLogs = gameLogs.filter((log: any) => 
                          GAME_TYPES[log.gameType]?.startsWith(game.name.split(' ')[0]) || 
                          log.gameType === game.name.split(' ')[0].toLowerCase()
                        );
                        
                        const completedLogs = relevantLogs.filter((log: any) => log.completionStatus === 'completed');
                        const completionRate = relevantLogs.length ? (completedLogs.length / relevantLogs.length * 100).toFixed(1) : 0;
                        
                        const totalDuration = relevantLogs.reduce((sum: number, log: any) => sum + log.duration, 0);
                        const avgDuration = relevantLogs.length ? Math.round(totalDuration / relevantLogs.length) : 0;
                        
                        return (
                          <TableRow key={game.name}>
                            <TableCell className="font-medium">{game.name}</TableCell>
                            <TableCell>{game.count}</TableCell>
                            <TableCell>{formatDuration(avgDuration)}</TableCell>
                            <TableCell>{completionRate}%</TableCell>
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
              <CardTitle>Game Session History</CardTitle>
              <CardDescription>
                Complete history of gamification activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Game Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameLogs.length > 0 ? (
                    gameLogs.map((log: any) => (
                      <TableRow key={log._id}>
                        <TableCell className="font-medium">{log.username || `User #${log.userId?.substring(0,5)}`}</TableCell>
                        <TableCell>
                          {GAME_TYPES[log.gameType] || log.gameType}
                        </TableCell>
                        <TableCell>{formatDuration(log.duration)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            log.completionStatus === 'completed' ? 'default' : 
                            log.completionStatus === 'in-progress' ? 'secondary' : 
                            'destructive'
                          }>
                            {log.completionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.score > 0 ? log.score.toLocaleString() : '-'}</TableCell>
                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <p className="text-muted-foreground">No game history available</p>
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