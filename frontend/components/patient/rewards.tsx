
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Rewards() {
  const [activeTab, setActiveTab] = useState("badges");

  const userRewards = {
    totalPoints: 1850, // Example points, replace with actual data
  };
  
  // Mock data for badges earned
  const earnedBadges = [
    {
      id: 1,
      name: "First Check-in",
      description: "Completed your first mood check-in",
      icon: "🏅",
      date: "Feb 10, 2025",
    },
    {
      id: 2,
      name: "3-Day Streak",
      description: "Completed check-ins 3 days in a row",
      icon: "🔥",
      date: "Feb 12, 2025",
    },
    {
      id: 3,
      name: "Mindfulness Beginner",
      description: "Completed 5 mindfulness challenges",
      icon: "🧘",
      date: "Feb 15, 2025",
    },
    {
      id: 4,
      name: "Gratitude Starter",
      description: "Completed 3 gratitude journal entries",
      icon: "🙏",
      date: "Feb 18, 2025",
    },
  ];

  // Mock data for badges to earn next
  const upcomingBadges = [
    {
      id: 5,
      name: "7-Day Streak",
      description: "Complete check-ins 7 days in a row",
      icon: "🔥",
      progress: 85,
    },
    {
      id: 6,
      name: "Mindfulness Intermediate",
      description: "Complete 10 mindfulness challenges",
      icon: "🧘",
      progress: 60,
    },
    {
      id: 7,
      name: "Social Butterfly",
      description: "Engage with 5 community members",
      icon: "🦋",
      progress: 40,
    },
  ];

  // Mock data for redeemable rewards
  const availableRewards = [
    {
      id: 1,
      name: "Premium Meditation Pack",
      description: "Access to 10 premium guided meditations",
      cost: 500,
      icon: "🧘",
    },
    {
      id: 2,
      name: "Wellness Journal Template",
      description: "Downloadable wellness journal template",
      cost: 300,
      icon: "📓",
    },
    {
      id: 3,
      name: "10% Off Partner Store",
      description: "Get 10% off at our wellness partner store",
      cost: 1000,
      icon: "🛍️",
    },
  ];

  // Mock data for redeemed rewards
  const redeemedRewards = [
    {
      id: 4,
      name: "Wellness E-Book",
      description: "Guide to daily mindfulness practices",
      date: "Feb 20, 2025",
      icon: "📚",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold">{userRewards.totalPoints}  </div>
          <div className="text-muted-foreground">Total Points</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold">{earnedBadges.length}</div>
          <div className="text-muted-foreground">Badges Earned</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold">{redeemedRewards.length}</div>
          <div className="text-muted-foreground">Rewards Redeemed</div>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="redeem">Redeem Rewards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="badges" className="space-y-4">
          <h3 className="text-lg font-medium">Badges You've Earned</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {earnedBadges.map((badge) => (
              <Card key={badge.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{badge.name}</h4>
                        <Badge variant="outline" className="ml-2">
                          {badge.date}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <h3 className="text-lg font-medium mt-6">Badges to Earn Next</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingBadges.map((badge) => (
              <Card key={badge.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{badge.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {badge.description}
                      </p>
                      <div className="space-y-1">
                        <Progress value={badge.progress} className="h-2" />
                        <p className="text-xs text-right text-muted-foreground">
                          {badge.progress}% complete
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="redeem" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Rewards</h3>
            <Badge variant="outline" className="px-3">
              <span className="font-bold mr-1">1,850</span> Points Available
            </Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {availableRewards.map((reward) => (
              <Card key={reward.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                      {reward.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{reward.name}</h4>
                        <Badge className="ml-2">
                          {reward.cost} Points
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reward.description}
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 w-full"
                        disabled={reward.cost > 1850}
                      >
                        Redeem Reward
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <h3 className="text-lg font-medium mt-6">Redeemed Rewards</h3>
          {redeemedRewards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {redeemedRewards.map((reward) => (
                <Card key={reward.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                        {reward.icon}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-medium">{reward.name}</h4>
                          <Badge variant="outline" className="ml-2">
                            {reward.date}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reward.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">You haven't redeemed any rewards yet.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}