"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Clock, HeartPulse, Play, Plus, Heart } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TherapyPlaylists() {
  const [category, setCategory] = useState("all");
  
  const [playlists] = useState([
    {
      id: 1,
      title: "Anxiety Reduction",
      description: "Calming instrumental music designed to reduce stress and anxiety",
      duration: "45 min",
      therapist: "Dr. Sarah Johnson",
      category: "anxiety",
      tracks: 8,
      coverArt: "/api/placeholder/200/200",
      isFavorite: true
    },
    {
      id: 2,
      title: "Deep Sleep",
      description: "Gentle sounds and frequencies to help with sleep disorders",
      duration: "60 min",
      therapist: "Emma Roberts, MT-BC",
      category: "sleep",
      tracks: 6,
      coverArt: "/api/placeholder/200/200",
      isFavorite: false
    },
    {
      id: 3,
      title: "Emotional Balance",
      description: "Musical journey to process complex emotions",
      duration: "50 min",
      therapist: "Michael Chang, MT-BC",
      category: "emotional",
      tracks: 10,
      coverArt: "/api/placeholder/200/200",
      isFavorite: true
    },
    {
      id: 4,
      title: "Morning Motivation",
      description: "Energizing rhythms to start your day with positivity",
      duration: "30 min",
      therapist: "Dr. James Wilson",
      category: "mood",
      tracks: 7,
      coverArt: "/api/placeholder/200/200",
      isFavorite: false
    }
  ]);

  const filteredPlaylists = category === "all" 
    ? playlists 
    : playlists.filter(playlist => playlist.category === category);

  return (
    <div className="space-y-4">
      <Tabs value={category} onValueChange={setCategory} className="w-full">
        <TabsList className="w-full justify-start mb-4 overflow-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="anxiety">Anxiety</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="emotional">Emotional</TabsTrigger>
          <TabsTrigger value="mood">Mood</TabsTrigger>
          <TabsTrigger value="focus">Focus</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlaylists.map((playlist) => (
          <Card key={playlist.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative aspect-square bg-slate-100">
              <img 
                src={playlist.coverArt} 
                alt={playlist.title}
                className="w-full h-full object-cover"
              />
              <Button 
                className="absolute right-2 top-2" 
                size="icon" 
                variant={playlist.isFavorite ? "default" : "outline"}
              >
                <Heart className={`h-4 w-4 ${playlist.isFavorite ? "fill-white" : ""}`} />
              </Button>
              <Button 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" 
                size="icon" 
                variant="default"
              >
                <Play className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{playlist.title}</h3>
                <Badge variant="outline">{playlist.tracks} tracks</Badge>
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-1">{playlist.description}</p>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>{playlist.duration}</span>
                </div>
                <div className="flex items-center">
                  <HeartPulse className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>For {playlist.category}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Play Now
                </Button>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center pt-2">
        <Button variant="outline">Load More Playlists</Button>
      </div>
    </div>
  );
}