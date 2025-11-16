"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Brain, Calendar, Clock, Heart, Sparkles } from "lucide-react";

const reminderCategories = [
  {
    id: "meditation",
    name: "Meditation Reminders",
    description: "Daily reminders to practice mindfulness and meditation",
    enabled: true,
    frequency: "daily",
    time: "08:00",
    icon: Brain
  },
  {
    id: "selfcare",
    name: "Self-Care Activities",
    description: "Suggestions for self-care activities based on your preferences",
    enabled: true,
    frequency: "daily",
    time: "17:30",
    icon: Heart
  },
  {
    id: "mood",
    name: "Mood Check-ins",
    description: "Regular prompts to track your mood and emotional state",
    enabled: true,
    frequency: "daily",
    time: "20:00",
    icon: Sparkles
  },
  {
    id: "hydration",
    name: "Hydration Reminders",
    description: "Reminders to drink water throughout the day",
    enabled: false,
    frequency: "hourly",
    time: "09:00",
    icon: Heart
  },
  {
    id: "exercise",
    name: "Exercise Prompts",
    description: "Suggestions for quick exercises and stretches",
    enabled: false,
    frequency: "daily",
    time: "15:00",
    icon: Heart
  }
];

const upcomingReminders = [
  {
    id: 1,
    title: "Morning Meditation",
    description: "10-minute guided meditation for focus",
    time: "08:00 AM",
    date: "Today"
  },
  {
    id: 2,
    title: "Self-Care Break",
    description: "Take a 5-minute break to stretch and breathe",
    time: "12:30 PM",
    date: "Today"
  },
  {
    id: 3,
    title: "Evening Mood Check-in",
    description: "Record your mood and reflect on your day",
    time: "08:00 PM",
    date: "Today"
  },
  {
    id: 4,
    title: "Morning Meditation",
    description: "10-minute guided meditation for calm",
    time: "08:00 AM",
    date: "Tomorrow"
  }
];

export function WellnessReminders() {
  const [categories, setCategories] = useState(reminderCategories);

  const handleToggleReminder = (id: string) => {
    setCategories(
      categories.map((category) =>
        category.id === id ? { ...category, enabled: !category.enabled } : category
      )
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Reminders</TabsTrigger>
          <TabsTrigger value="settings">Reminder Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingReminders.map((reminder) => (
            <Card key={reminder.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{reminder.title}</h3>
                      <Badge variant="outline">{reminder.date}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{reminder.description}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {reminder.time}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Snooze
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="text-center">
            <Button variant="outline">View All Reminders</Button>
          </div>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-primary/10 p-1.5">
                      <category.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                      {category.enabled && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {category.frequency === "daily" ? "Daily" : 
                             category.frequency === "hourly" ? "Hourly" : 
                             category.frequency === "weekly" ? "Weekly" : 
                             "Custom"}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {category.time}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      id={`reminder-${category.id}`}
                      checked={category.enabled}
                      onCheckedChange={() => handleToggleReminder(category.id)}
                    />
                  </div>
                </div>
                {category.enabled && (
                  <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor={`frequency-${category.id}`} className="text-xs">
                        Frequency
                      </Label>
                      <Select defaultValue={category.frequency}>
                        <SelectTrigger id={`frequency-${category.id}`} className="mt-1">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`time-${category.id}`} className="text-xs">
                        Time
                      </Label>
                      <Select defaultValue={category.time}>
                        <SelectTrigger id={`time-${category.id}`} className="mt-1">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="08:00">8:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="17:30">5:30 PM</SelectItem>
                          <SelectItem value="20:00">8:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Notification Preferences</p>
                <p className="text-sm text-muted-foreground">
                  Choose how you want to receive reminders
                </p>
              </div>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}