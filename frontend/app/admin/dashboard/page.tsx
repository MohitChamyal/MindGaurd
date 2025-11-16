'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoodTrends } from '../components/dashboard/mood-trends';

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Mood Trends</CardTitle>
          <CardDescription>
            Aggregated user mood data over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MoodTrends />
        </CardContent>
      </Card>
    </div>
  );
} 