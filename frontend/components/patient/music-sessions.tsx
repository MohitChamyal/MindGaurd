"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Play, Download } from "lucide-react";

export function MusicSessions() {
  const [sessions] = useState([
    {
      id: 1,
      title: "Stress Relief through Rhythm",
      therapist: "Dr. Sarah Johnson",
      date: "Tuesdays & Thursdays",
      time: "6:00 PM - 7:00 PM",
      participants: 24,
      type: "Live Online",
      isRecorded: true,
      isDownloadable: true
    },
    {
      id: 2,
      title: "Mindful Music Meditation",
      therapist: "Michael Chang, MT-BC",
      date: "Mondays & Wednesdays",
      time: "7:30 PM - 8:30 PM",
      participants: 18,
      type: "Live Online",
      isRecorded: true,
      isDownloadable: false
    },
    {
      id: 3,
      title: "Therapeutic Sound Journey",
      therapist: "Emma Roberts, MT-BC",
      date: "Fridays",
      time: "5:30 PM - 7:00 PM",
      participants: 12,
      type: "In-Person",
      isRecorded: false,
      isDownloadable: false
    },
    {
      id: 4,
      title: "Music for Sleep Improvement",
      therapist: "Dr. James Wilson",
      date: "On-Demand",
      time: "Anytime",
      participants: 156,
      type: "Recorded",
      isRecorded: true,
      isDownloadable: true
    }
  ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {sessions.map((session) => (
          <Card key={session.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{session.title}</h3>
                <Badge variant={session.type === "Live Online" ? "default" : session.type === "Recorded" ? "secondary" : "outline"}>
                  {session.type}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">Led by {session.therapist}</p>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>{session.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>{session.time}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>{session.participants} participants</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  {session.type === "Recorded" ? "Play" : "Join"}
                </Button>
                {session.isDownloadable && (
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center pt-2">
        <Button variant="outline">View All Sessions</Button>
      </div>
    </div>
  );
}