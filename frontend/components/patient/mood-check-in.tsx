"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MoodCheckIn() {
  // Current date for display
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // State for the selected mood and notes
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [streakDays, setStreakDays] = useState(6);
  const [checkInComplete, setCheckInComplete] = useState(false);

  // Mock mood data
  const moods = [
    {
      emoji: "😢",
      label: "Sad",
      color: "bg-blue-100 hover:bg-blue-200",
      textColor: "text-blue-700",
    },
    {
      emoji: "😔",
      label: "Down",
      color: "bg-indigo-100 hover:bg-indigo-200",
      textColor: "text-indigo-700",
    },
    {
      emoji: "😐",
      label: "Neutral",
      color: "bg-gray-100 hover:bg-gray-200",
      textColor: "text-gray-700",
    },
    {
      emoji: "🙂",
      label: "Good",
      color: "bg-amber-100 hover:bg-amber-200",
      textColor: "text-amber-700",
    },
    {
      emoji: "😀",
      label: "Great",
      color: "bg-green-100 hover:bg-green-200",
      textColor: "text-green-700",
    },
  ];

  // Mock streak data
  const lastSevenDays = [
    { day: "Mon", completed: true },
    { day: "Tue", completed: true },
    { day: "Wed", completed: true },
    { day: "Thu", completed: true },
    { day: "Fri", completed: true },
    { day: "Sat", completed: true },
    { day: "Sun", completed: false },
  ];

  // Handle mood selection
  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
  };

  // Handle check-in submission
  const handleSubmit = () => {
    if (selectedMood) {
      // In a real app, you would save this data to your backend
      console.log("Mood:", selectedMood);
      console.log("Notes:", notes);
      setStreakDays(streakDays + 1);
      setCheckInComplete(true);
    }
  };

  // Reset the form to check in again
  const handleReset = () => {
    setSelectedMood(null);
    setNotes("");
    setCheckInComplete(false);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="today">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Today's Check-in</TabsTrigger>
          <TabsTrigger value="history">Check-in History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="space-y-4">
          {!checkInComplete ? (
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium">{today}</h3>
                <p className="text-muted-foreground">How are you feeling today?</p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {moods.map((mood) => (
                  <Button
                    key={mood.label}
                    variant="outline"
                    className={`h-24 flex flex-col items-center justify-center gap-2 ${
                      mood.color
                    } ${
                      selectedMood === mood.label ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleMoodSelect(mood.label)}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className={`text-sm font-medium ${mood.textColor}`}>
                      {mood.label}
                    </span>
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Notes (optional):
                </label>
                <textarea
                  className="w-full h-24 p-2 border rounded-md"
                  placeholder="What's on your mind today?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                disabled={!selectedMood}
                onClick={handleSubmit}
              >
                Submit Check-in
              </Button>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="text-5xl mb-2">✅</div>
              <h3 className="text-xl font-medium">Check-in Complete!</h3>
              <p>
                You're feeling <strong>{selectedMood}</strong> today. Your streak is
                now <strong>{streakDays} days</strong>!
              </p>
              <Button variant="outline" onClick={handleReset}>
                Check-in Again
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Your Streak</h3>
                <span className="text-lg font-bold">{streakDays} Days</span>
              </div>
              <Progress value={(streakDays / 30) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {30 - streakDays} days until you reach a 30-day streak
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Last 7 Days</h3>
              <div className="grid grid-cols-7 gap-1 text-center">
                {lastSevenDays.map((day, index) => (
                  <div key={index} className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {day.day}
                    </div>
                    <div
                      className={`h-10 w-10 mx-auto rounded-full flex items-center justify-center ${
                        day.completed
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {day.completed ? "✓" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-medium">Recent Entries</h3>
              
              {/* Mock past entries */}
              {[
                { date: "Feb 28", mood: "Good", emoji: "🙂" },
                { date: "Feb 27", mood: "Great", emoji: "😀" },
                { date: "Feb 26", mood: "Neutral", emoji: "😐" },
                { date: "Feb 25", mood: "Down", emoji: "😔" },
                { date: "Feb 24", mood: "Good", emoji: "🙂" },
              ].map((entry, i) => (
                <Card key={i} className="p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{entry.date}</div>
                    <div className="text-sm text-muted-foreground">
                      Mood: {entry.mood}
                    </div>
                  </div>
                  <div className="text-2xl">{entry.emoji}</div>
                </Card>
              ))}
              
              <Button variant="outline" className="w-full">View All Check-ins</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}