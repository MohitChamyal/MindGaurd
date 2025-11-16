"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";

const activities = [
  {
    id: 1,
    title: "Morning Meditation",
    description: "10-minute guided meditation to reduce anxiety",
    duration: "10 min",
    category: "Mindfulness",
    aiRecommended: true,
    completed: false
  },
  {
    id: 2,
    title: "Gratitude Journaling",
    description: "Write down three things you're grateful for today",
    duration: "5 min",
    category: "Self-reflection",
    aiRecommended: true,
    completed: false
  },
  {
    id: 3,
    title: "Deep Breathing Exercise",
    description: "Practice 4-7-8 breathing technique for stress relief",
    duration: "3 min",
    category: "Stress Relief",
    aiRecommended: false,
    completed: true
  },
  {
    id: 4,
    title: "Progressive Muscle Relaxation",
    description: "Guided session to release physical tension",
    duration: "15 min",
    category: "Relaxation",
    aiRecommended: false,
    completed: false
  }
];

export function RecommendedActivities() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recommended Activities</CardTitle>
            <CardDescription>Personalized suggestions for your wellbeing</CardDescription>
          </div>
          <Button variant="outline" size="sm">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className={`flex items-start space-x-4 rounded-md border p-3 ${activity.completed ? 'bg-muted/50' : ''}`}
            >
              <div className="mt-0.5">
                {activity.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-primary" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${activity.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {activity.title}
                    </p>
                    {activity.aiRecommended && (
                      <Badge variant="outline" className="flex items-center gap-1 h-5 text-xs">
                        <Sparkles className="h-3 w-3" />
                        AI Pick
                      </Badge>
                    )}
                  </div>
                </div>
                <p className={`text-xs ${activity.completed ? 'text-muted-foreground/70 line-through' : 'text-muted-foreground'}`}>
                  {activity.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {activity.duration}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.category}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}