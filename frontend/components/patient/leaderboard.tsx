"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function Leaderboard() {
  // Mock data for leaderboard
  const leaderboardData = [
    {
      id: 1,
      name: "Sarah Johnson",
      avatar: "/api/placeholder/32/32",
      points: 2450,
      streak: 14,
      rank: 1,
      badges: ["Mindfulness Master", "30-Day Streak"],
    },
    {
      id: 2,
      name: "David Chen",
      avatar: "/api/placeholder/32/32",
      points: 2320,
      streak: 21,
      rank: 2,
      badges: ["Gratitude Guru", "Self-Care Champion"],
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      avatar: "/api/placeholder/32/32",
      points: 2180,
      streak: 12,
      rank: 3,
      badges: ["Journal Expert"],
    },
    {
      id: 4,
      name: "You",
      avatar: "/api/placeholder/32/32",
      points: 1850,
      streak: 7,
      rank: 4,
      badges: ["Rising Star"],
      isCurrentUser: true,
    },
    {
      id: 5,
      name: "Michael Kim",
      avatar: "/api/placeholder/32/32",
      points: 1720,
      streak: 5,
      rank: 5,
      badges: [],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold">4th</div>
          <div className="text-muted-foreground">Your Rank</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold">1,850</div>
          <div className="text-muted-foreground">Your Points</div>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold">7 Days</div>
          <div className="text-muted-foreground">Current Streak</div>
        </Card>
      </div>

      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left font-medium">Rank</th>
                <th className="h-12 px-4 text-left font-medium">User</th>
                <th className="h-12 px-4 text-left font-medium">Points</th>
                <th className="h-12 px-4 text-left font-medium">Streak</th>
                <th className="h-12 px-4 text-left font-medium">Badges</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b ${
                    user.isCurrentUser ? "bg-muted/50 font-medium" : ""
                  }`}
                >
                  <td className="p-4">#{user.rank}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4">{user.points}</td>
                  <td className="p-4">{user.streak} days</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {user.badges.map((badge) => (
                        <Badge key={badge} variant="secondary">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}