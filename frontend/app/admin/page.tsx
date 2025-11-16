'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Overview } from '@/app/admin/components/dashboard/overview';
import { RecentUsers } from '@/app/admin/components/dashboard/recent-users';
import { RecentTherapists } from '@/app/admin/components/dashboard/recent-therapists';
import { CrisisAlerts } from '@/app/admin/components/dashboard/crisis-alerts';
import { EngagementMetrics } from '@/app/admin/components/dashboard/engagement-metrics';
import { MoodTrends } from '@/app/admin/components/dashboard/mood-trends';
import { SystemStatus } from '@/app/admin/components/dashboard/system-status';
import { DashboardCardStats } from '@/app/admin/components/dashboard/dashboard-stats';
import Link from 'next/link';
import { MobileNav } from "./components/mobile-nav";

export default function AdminDashboard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // Format date to match the screenshot: "April 18, 2025, 2:57:29 PM"
  const currentDate = new Date(2025, 3, 18, 14, 57, 29); // Month is 0-indexed, so 3 = April

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>
            Last updated: {currentDate.toLocaleString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            })}
          </span>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
      
      {/* Desktop Navigation */}
      <div className="hidden md:block bg-secondary/20 rounded-lg p-3">
        <div className="flex space-x-4">
          <Link href="/admin" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Overview
          </Link>
          <Link href="/admin/users" className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            Users
          </Link>
          <Link href="/admin/therapists" className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            Therapists
          </Link>
          <Link href="/admin/ai-analytics" className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            Analytics
          </Link>
        </div>
      </div>
      
      <div className="space-y-4">
        <DashboardCardStats />
        
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-6">
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">User Activity Overview</CardTitle>
              <CardDescription className="text-sm">
                Summary of recent activity levels
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview />
            </CardContent>
          </Card>
          
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">User Sentiment Over Time</CardTitle>
              <CardDescription className="text-sm">
                Trends in emotional states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MoodTrends />
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>
                New user registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentUsers />
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Therapists</CardTitle>
              <CardDescription>
                Newly onboarded therapists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTherapists />
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Crisis Alerts</CardTitle>
              <CardDescription>
                Recent high-risk interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CrisisAlerts />
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>
                User engagement and retention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementMetrics />
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Platform health and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemStatus />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}