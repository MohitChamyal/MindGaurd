"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SupportGroupsProps {
  anonymousMode: boolean;
}

const supportGroups = [
  {
    id: 1,
    name: "Possible Major Depressive Disorder",
    description: "A support space for individuals experiencing deep sadness, loss of interest, and prolonged fatigue.",
    members: 42,
    facilitator: "Dr. Sarah Johnson",
    facilitatorAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=256&h=256&auto=format&fit=crop",
    discussions: 58,
    discordLink: "https://discord.gg/FA8QU2na",
    chatLink: "https://discord.com/channels/1347873213920575528/1347873449892249664",
  },
  {
    id: 2,
    name: "Mild Mood Disturbance",
    description: "For those experiencing frequent mood shifts, irritability, and emotional highs & lows.",
    members: 30,
    facilitator: "Dr. Michael Chen",
    facilitatorAvatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=256&h=256&auto=format&fit=crop",
    discussions: 40,
    discordLink: "https://discord.gg/rmmGBxvf",
    chatLink: "https://discord.com/channels/1347873213920575528/1347874019814146118",
  },
  {
    id: 3,
    name: "Severe Anxiety Disorder",
    description: "A safe space for individuals dealing with overwhelming stress, excessive worry, and panic attacks.",
    members: 56,
    facilitator: "Dr. Emily Rodriguez",
    facilitatorAvatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=256&h=256&auto=format&fit=crop",
    discussions: 72,
    discordLink: "https://discord.gg/nKCmSJwW",
    chatLink: "https://discord.com/channels/1347873213920575528/1347875615411273819",
  },
  {
    id: 4,
    name: "Mild Anxiety Symptoms",
    description: "For those facing occasional anxiety, social nervousness, and difficulty relaxing.",
    members: 22,
    facilitator: "Dr. Rachel Kim",
    facilitatorAvatar: "https://images.unsplash.com/photo-1549383028-df14d948a871?q=80&w=256&h=256&auto=format&fit=crop",
    discussions: 35,
    discordLink: "https://discord.gg/h2ADUpjm",
    chatLink: "https://discord.com/channels/1347873213920575528/1347875910090489919",
  },
  {
    id: 5,
    name: "Severe Sleep Disturbance",
    description: "A group dedicated to overcoming insomnia, night terrors, and extreme sleep deprivation.",
    members: 47,
    facilitator: "Dr. Jason Lee",
    facilitatorAvatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=256&h=256&auto=format&fit=crop",
    discussions: 50,
    discordLink: "https://discord.gg/ezukJKWm",
    chatLink: "https://discord.com/channels/1347873213920575528/1347876429190139979",
  },
  {
    id: 6,
    name: "Moderate Sleep Issues",
    description: "A support group for those struggling with light insomnia, disrupted sleep patterns, and fatigue.",
    members: 38,
    facilitator: "Dr. Amanda Wright",
    facilitatorAvatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=256&h=256&auto=format&fit=crop",
    discussions: 28,
    discordLink: "https://discord.gg/9cRZJ9GX",
    chatLink: "https://discord.com/channels/1347873213920575528/1347876863640604743",
  },
  {
    id: 7,
    name: "Self-Care Deficit",
    description: "A community for those finding it difficult to manage daily self-care, hygiene, and wellness habits.",
    members: 25,
    facilitator: "Dr. Sophia Patel",
    facilitatorAvatar: "https://images.unsplash.com/photo-1502767089025-6572583495a3?q=80&w=256&h=256&auto=format&fit=crop",
    discussions: 20,
    discordLink: "https://discord.gg/4thdqUzN",
    chatLink: "https://discord.com/channels/1347873213920575528/1347877112412901458",
  },
  {
    id: 8,
    name: "Social Anxiety Support",
    description: "A welcoming community for those experiencing social anxiety, fear of judgment, and difficulty in social situations.",
    members: 33,
    facilitator: "Dr. David Thompson",
    facilitatorAvatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=256&h=256&auto=format&fit=crop",
    discussions: 45,
    discordLink: "https://discord.gg/NTdCKCjx",
    chatLink: "https://discord.com/channels/1347873213920575528/1347878222607552512",
  },
  {
    id: 9,
    name: "Stress Management & Burnout",
    description: "For professionals and students dealing with workplace/academic stress, burnout, and work-life balance challenges.",
    members: 64,
    facilitator: "Dr. Lisa Martinez",
    facilitatorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&auto=format&fit=crop",
    discussions: 82,
    discordLink: "https://discord.gg/nHyN3CHj",
    chatLink: "https://discord.com/channels/1347873213920575528/1347878452325388368",
  }
];

export function SupportGroups({ anonymousMode }: SupportGroupsProps) {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter groups based on search query
  const filteredGroups = supportGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.facilitator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show only first 6 groups if not showing all
  const visibleGroups = showAll ? filteredGroups : filteredGroups.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search groups by name, description, or facilitator..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleGroups.map((group) => (
          <Card key={group.id}>
            <CardContent className="p-4 space-y-3">
              {/* Title and Facilitator */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={anonymousMode ? "" : group.facilitatorAvatar} />
                  <AvatarFallback>{group.facilitator.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{group.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    Facilitated by {anonymousMode ? "Healthcare Professional" : group.facilitator}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">{group.description}</p>

              {/* Stats: Members and Discussions */}
              <div className="flex items-center text-xs text-muted-foreground space-x-4">
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  {group.members} Members
                </div>
                <div className="flex items-center">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  {group.discussions} Discussions
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(group.chatLink, "_blank")}
                >
                  View Discussions
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(group.discordLink, "_blank")}
                >
                  Join Group
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results Message */}
      {filteredGroups.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No groups found matching your search.</p>
        </div>
      )}

      {/* View All/Show Less Button */}
      {filteredGroups.length > 6 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : "View All Groups"}
          </Button>
        </div>
      )}
    </div>
  );
}