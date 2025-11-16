'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LineChart, BarChart, DoughnutChart } from "@/app/admin/components/ui/charts"
import { Calendar, TrendingUp, Users, Clock, Activity } from "lucide-react"

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("6M")
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [])

  if (loading) {
    return <div>Loading analytics...</div>
  }

  const overview = analyticsData?.overview || {
    totalUsers: 0,
    totalInteractions: 0,
    totalChats: 0,
    flaggedInteractions: 0
  }

  const monthlyData = analyticsData?.monthlyTrends?.map((item: {
    _id: { year: number; month: number };
    count: number;
  }) => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    sessions: item.count
  })) || []

  const topicData = analyticsData?.topics?.map((item: {
    _id: string;
    count: number;
  }) => ({
    specialization: item._id,
    count: item.count
  })) || []

  const sentimentData = analyticsData?.sentiment?.map((item: {
    _id: string;
    count: number;
  }) => ({
    month: item._id,
    users: item.count
  })) || []

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Overview</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1M">Last Month</SelectItem>
            <SelectItem value="3M">Last 3 Months</SelectItem>
            <SelectItem value="6M">Last 6 Months</SelectItem>
            <SelectItem value="1Y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              System total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalInteractions}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalChats}</div>
            <p className="text-xs text-muted-foreground">
              Chat messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.flaggedInteractions}</div>
            <p className="text-xs text-muted-foreground">
              Needs review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <LineChart
                data={monthlyData.map((item: { month: string; sessions: number }) => ({
                  month: item.month,
                  value: item.sessions
                }))}
                label="Monthly Sessions"
                color="rgb(99, 102, 241)"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <BarChart
                data={sentimentData.map((item: { month: string; users: number }) => ({
                  label: item.month,
                  value: item.users
                }))}
                title="Sentiment Analysis"
                color="rgb(59, 130, 246)"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Common Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <DoughnutChart
                data={topicData.map((item: { specialization: string; count: number }) => ({
                  label: item.specialization,
                  value: item.count
                }))}
                title="Topic Distribution"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}