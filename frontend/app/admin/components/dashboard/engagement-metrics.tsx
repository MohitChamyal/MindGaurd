'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { apiUrl } from '@/lib/config';

interface EngagementData {
  dailyActive: number;
  weeklyActive: number;
  monthlyActive: number;
  retentionRate: number;
  retentionChange: number;
  avgSession: number;
  avgSessionChange: number;
}

export function EngagementMetrics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<EngagementData>({
    dailyActive: 0,
    weeklyActive: 0,
    monthlyActive: 0,
    retentionRate: 78, // Placeholder until we have real retention data
    retentionChange: 5,
    avgSession: 12, // Placeholder until we have real session data
    avgSessionChange: 2
  });

  useEffect(() => {
    fetchEngagementMetrics();
  }, []);

  const fetchEngagementMetrics = async () => {
    try {
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

      const response = await fetch(`${apiUrl}/api/test/users`, { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const users = await response.json();

      // Calculate active users based on registration dates
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalUsers = users.length;
      const dailyActive = users.filter((user: any) => {
        const regDate = new Date(user.createdAt?.$date || user.createdAt);
        return regDate >= oneDayAgo;
      }).length;

      const weeklyActive = users.filter((user: any) => {
        const regDate = new Date(user.createdAt?.$date || user.createdAt);
        return regDate >= oneWeekAgo;
      }).length;

      const monthlyActive = users.filter((user: any) => {
        const regDate = new Date(user.createdAt?.$date || user.createdAt);
        return regDate >= oneMonthAgo;
      }).length;

      // Calculate percentages
      const dailyActivePercent = totalUsers > 0 ? Math.round((dailyActive / totalUsers) * 100) : 0;
      const weeklyActivePercent = totalUsers > 0 ? Math.round((weeklyActive / totalUsers) * 100) : 0;
      const monthlyActivePercent = totalUsers > 0 ? Math.round((monthlyActive / totalUsers) * 100) : 0;

      setMetrics(prev => ({
        ...prev,
        dailyActive: dailyActivePercent,
        weeklyActive: weeklyActivePercent,
        monthlyActive: monthlyActivePercent
      }));

    } catch (err) {
      console.error('Error fetching engagement metrics:', err);
      setError('Failed to load engagement metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-2 bg-muted rounded"></div>
        <div className="h-2 bg-muted rounded"></div>
        <div className="h-2 bg-muted rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Daily Active Users</span>
            <span className="text-sm font-medium">{metrics.dailyActive}%</span>
          </div>
          <Progress value={metrics.dailyActive} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Weekly Active Users</span>
            <span className="text-sm font-medium">{metrics.weeklyActive}%</span>
          </div>
          <Progress value={metrics.weeklyActive} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Monthly Active Users</span>
            <span className="text-sm font-medium">{metrics.monthlyActive}%</span>
          </div>
          <Progress value={metrics.monthlyActive} className="h-2" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="text-sm font-medium">Retention Rate</span>
          <div className="flex items-center">
            <span className="text-2xl font-bold">{metrics.retentionRate}%</span>
            <span className="ml-2 text-xs text-green-500">+{metrics.retentionChange}%</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <span className="text-sm font-medium">Avg. Session</span>
          <div className="flex items-center">
            <span className="text-2xl font-bold">{metrics.avgSession}m</span>
            <span className="ml-2 text-xs text-green-500">+{metrics.avgSessionChange}m</span>
          </div>
        </div>
      </div>
    </div>
  );
}