"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Calendar, Award, BarChart } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GameLog {
  _id: string;
  userId: string;
  gameType: string;
  duration: number;
  completionStatus: string;
  score: number;
  notes: string;
  metadata: any;
  createdAt: string;
}

interface GameStats {
  gameTimes: Array<{
    _id: string;
    totalTime: number;
    count: number;
    avgScore: number;
  }>;
  highestScores: Array<{
    _id: string;
    highestScore: number;
  }>;
  dailyActivity: Array<{
    _id: string;
    count: number;
  }>;
}

const GameHistoryPage = () => {
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGameLogs();
    fetchGameStats();
  }, []);

  const fetchGameLogs = async () => {
    try {
      const userId = localStorage.getItem('mindguard_user_id');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`/api/gameLogs?userId=${userId}`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch game logs');
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching game logs:', error);
      setError("Failed to load game history. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGameStats = async () => {
    try {
      const userId = localStorage.getItem('mindguard_user_id');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) {
        return;
      }
      
      const response = await fetch(`/api/gameLogs/stats?userId=${userId}`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch game statistics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching game statistics:', error);
      // Don't set error state, as the logs might still be available
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy h:mm a");
  };

  const getGameTypeEmoji = (type: string) => {
    switch (type) {
      case 'notes':
        return '📝';
      case 'puzzle':
        return '🧩';
      case 'breathing':
        return '🧘';
      default:
        return '🎮';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'abandoned':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchGameLogs}
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalPlayedTime = stats?.gameTimes.reduce((acc, game) => acc + game.totalTime, 0) || 0;
  const totalSessions = stats?.gameTimes.reduce((acc, game) => acc + game.count, 0) || 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Game History</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Total Time Played
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.floor(totalPlayedTime / 60)} minutes
            </p>
            <p className="text-sm text-muted-foreground">
              Across {totalSessions} sessions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Most Played Game
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.gameTimes.length ? (
              <>
                <p className="text-3xl font-bold">
                  {getGameTypeEmoji(stats.gameTimes.sort((a, b) => b.count - a.count)[0]._id)}&nbsp;
                  {stats.gameTimes.sort((a, b) => b.count - a.count)[0]._id}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.gameTimes.sort((a, b) => b.count - a.count)[0].count} times
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No games played yet</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Longest Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length ? (
              <>
                <p className="text-3xl font-bold">
                  {formatDuration(Math.max(...logs.map(log => log.duration)))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getGameTypeEmoji(logs.sort((a, b) => b.duration - a.duration)[0].gameType)}&nbsp;
                  {logs.sort((a, b) => b.duration - a.duration)[0].gameType}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No sessions recorded</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Games</TabsTrigger>
          <TabsTrigger value="notes">Notes Game</TabsTrigger>
          <TabsTrigger value="puzzle">Puzzle Game</TabsTrigger>
          <TabsTrigger value="breathing">Breathing Game</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <GameLogTable logs={logs} formatDate={formatDate} formatDuration={formatDuration} getGameTypeEmoji={getGameTypeEmoji} getStatusColor={getStatusColor} />
        </TabsContent>
        
        <TabsContent value="notes">
          <GameLogTable
            logs={logs.filter(log => log.gameType === 'notes')}
            formatDate={formatDate}
            formatDuration={formatDuration}
            getGameTypeEmoji={getGameTypeEmoji}
            getStatusColor={getStatusColor}
          />
        </TabsContent>
        
        <TabsContent value="puzzle">
          <GameLogTable
            logs={logs.filter(log => log.gameType === 'puzzle')}
            formatDate={formatDate}
            formatDuration={formatDuration}
            getGameTypeEmoji={getGameTypeEmoji}
            getStatusColor={getStatusColor}
          />
        </TabsContent>
        
        <TabsContent value="breathing">
          <GameLogTable
            logs={logs.filter(log => log.gameType === 'breathing')}
            formatDate={formatDate}
            formatDuration={formatDuration}
            getGameTypeEmoji={getGameTypeEmoji}
            getStatusColor={getStatusColor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface GameLogTableProps {
  logs: GameLog[];
  formatDate: (date: string) => string;
  formatDuration: (seconds: number) => string;
  getGameTypeEmoji: (type: string) => string;
  getStatusColor: (status: string) => string;
}

const GameLogTable = ({ logs, formatDate, formatDuration, getGameTypeEmoji, getStatusColor }: GameLogTableProps) => {
  if (logs.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No game sessions found</p>;
  }
  
  // Sort logs by date - newest first
  const sortedLogs = [...logs].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Game</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLogs.map((log) => (
              <TableRow key={log._id}>
                <TableCell className="font-medium">
                  {getGameTypeEmoji(log.gameType)} {log.gameType}
                </TableCell>
                <TableCell>{formatDate(log.createdAt)}</TableCell>
                <TableCell>{formatDuration(log.duration)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(log.completionStatus)}>
                    {log.completionStatus}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">{log.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default GameHistoryPage; 