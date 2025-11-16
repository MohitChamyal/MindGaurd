"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Leaderboard } from "@/components/patient/leaderboard";
import { MoodCheckIn } from "@/components/patient/mood-check-in";
import { Rewards } from "@/components/patient/rewards";
import ChallengesList from "@/components/patient/challenges-list";

export default function WellnessChallenges() {
  const [activeTab, setActiveTab] = useState("challenges");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wellness Challenges</h1>
          <p className="text-muted-foreground">
            Participate in self-care activities and earn rewards for your progress
          </p>
        </div>
        <Button>Check In Today</Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="checkin">Mood Check-in</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>
        <TabsContent value="challenges">
          <Card>
            <CardContent>
              <ChallengesList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="checkin">
          <Card>
            <CardHeader>
              <CardTitle>Daily Mood Check-in</CardTitle>
              <CardDescription>
                Track your mood and maintain your streak for consistent self-awareness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MoodCheckIn />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Community Leaderboard</CardTitle>
              <CardDescription>
                See how you rank among other participants in wellness challenges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Leaderboard />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Your Rewards</CardTitle>
              <CardDescription>
                Badges, discounts, and premium content unlocks you've earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Rewards />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}