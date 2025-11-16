"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, ThumbsUp, Users, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CommunityForumsProps {
  anonymousMode: boolean;
}

const inspiringPeople = [
  {
    id: 1,
    name: "Ravi Kumar",
    description: "Overcame severe anxiety with mindfulness and therapy.",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    online: true,
    calLink: "https://cal.com/vikrantsharma"
  },
  {
    id: 2,
    name: "Priya Sharma",
    description: "Battled depression and found hope through journaling and CBT.",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    online: false,
    calLink: "https://cal.com/ayushijain"
  },
  {
    id: 3,
    name: "Ayushi Jain",
    description: "Recovered from insomnia with a disciplined sleep routine.",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    online: true,
    calLink: "https://cal.com/ayushijain"
  },
  {
    id: 4,
    name: "Vikrant Sharma",
    description: "Recovered from Possible Major Depressive Disorder with a disciplined sleep routine.",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    online: true,
    calLink: "https://cal.com/gauravgupta"
  },
  {
    id: 5,
    name: "Animesh Lamba",
    description: "Recovered from Mild Mood Disturbance with a disciplined sleep routine.",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    online: true,
    calLink: "https://cal.com/gauravgupta"
  },
  {
    id: 6,
    name: "Neha Singh",
    description: "Recovered from Severe Anxiety Disorder with a disciplined sleep routine.",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    online: true,
    calLink: "https://cal.com/gauravgupta"
  },
  {
    id: 7,
    name: "Rohan Khanna",
    description: "Recovered from Severe Sleep Disturbance with a disciplined sleep routine.",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    online: true,
    calLink: "https://cal.com/gauravgupta"
  },
  {
    id: 8,
    name: "Sanjay Gupta",
    description: "Recovered from Self-Care Deficit with a disciplined sleep routine.",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    online: true,
    calLink: "https://cal.com/gauravgupta"
  },
  {
    id: 9,
    name: "Amit Patel",
    description: "Recovered from Stress Management & Burnout with a disciplined sleep routine.",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    online: true,
    calLink: "https://cal.com/gauravgupta"
  },
  {
    id: 10,
    name: "Rahul Mehta",
    description: "Recovered from Social Anxiety Support with a disciplined sleep routine.",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    online: true,
    calLink: "https://cal.com/gauravgupta"
  },
  {
    id: 11,
    name: "Karan Malhotra",
    description: "Recovered from Mild Anxiety Symptoms with a disciplined sleep routine.",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    online: true,
    calLink: "https://cal.com/gauravgupta"
  }  
];
const popularPosts = [
  {
    id: 1,
    title: "How I overcame panic attacks using the 5-4-3-2-1 technique",
    author: "Meera Sharma",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&h=256&auto=format&fit=crop",
    forum: "Anxiety Management Strategies",
    likes: 87,
    comments: 34,
    time: "2 days ago"
  },
  {
    id: 2,
    title: "My experience with cognitive behavioral therapy (CBT)",
    author: "Anonymous",
    authorAvatar: "",
    forum: "Depression Support",
    likes: 65,
    comments: 28,
    time: "3 days ago"
  },
  {
    id: 3,
    title: "A simple 10-minute meditation that changed my life",
    author: "Rohan Khanna",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop",
    forum: "Mindfulness & Meditation",
    likes: 112,
    comments: 45,
    time: "1 week ago"
  },
  {
    id: 4,
    title: "How I managed severe anxiety through mindfulness",
    author: "Ravi Kumar",
    authorAvatar: "https://randomuser.me/api/portraits/men/1.jpg",
    forum: "Anxiety Management Strategies",
    likes: 74,
    comments: 30,
    time: "5 days ago"
  },
  {
    id: 5,
    title: "Journaling helped me fight depression: My personal story",
    author: "Priya Sharma",
    authorAvatar: "https://randomuser.me/api/portraits/women/2.jpg",
    forum: "Depression Support",
    likes: 95,
    comments: 40,
    time: "1 week ago"
  },
  {
    id: 6,
    title: "Overcoming insomnia with a disciplined sleep routine",
    author: "Amit Patel",
    authorAvatar: "https://randomuser.me/api/portraits/men/3.jpg",
    forum: "Sleep & Insomnia Support",
    likes: 82,
    comments: 22,
    time: "3 days ago"
  },
  {
    id: 7,
    title: "My journey of battling social anxiety and gaining confidence",
    author: "Neha Singh",
    authorAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&h=256&auto=format&fit=crop",
    forum: "Social Anxiety Support",
    likes: 120,
    comments: 50,
    time: "2 weeks ago"
  },
  {
    id: 8,
    title: "How I managed stress and avoided burnout",
    author: "Rahul Verma",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&auto=format&fit=crop",
    forum: "Stress Management & Burnout",
    likes: 98,
    comments: 37,
    time: "4 days ago"
  }
];


export function CommunityForums({ anonymousMode }: CommunityForumsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    forum: "",
  });

  const forums = [
    "Anxiety Management Strategies",
    "Depression Support",
    "Mindfulness & Meditation",
    "Sleep & Insomnia Support",
    "Social Anxiety Support",
    "Stress Management & Burnout"
  ];

  const handleCreatePost = () => {
    if (newPost.title.trim() && newPost.content.trim() && newPost.forum) {
      // Here you would typically make an API call to create the post
      console.log("Creating new post:", newPost);
      setNewPostOpen(false);
      setNewPost({ title: "", content: "", forum: "" });
    }
  };

  const filteredPeople = inspiringPeople.filter(person =>
    person.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search forums and posts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  placeholder="Enter post title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="forum" className="text-sm font-medium">
                  Forum
                </label>
                <Select
                  value={newPost.forum}
                  onValueChange={(value) => setNewPost({ ...newPost, forum: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a forum" />
                  </SelectTrigger>
                  <SelectContent>
                    {forums.map((forum) => (
                      <SelectItem key={forum} value={forum}>
                        {forum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">
                  Content
                </label>
                <Textarea
                  id="content"
                  placeholder="Write your post content here..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="min-h-[200px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewPostOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePost}>
                Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-medium">Inspiring Stories</h3>
          {filteredPeople.map((person) => (
            <Card key={person.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback>{person.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">{person.name}</h4>
                    <p className="text-sm text-muted-foreground">{person.description}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.open(person.calLink, "_blank")}>Join</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Popular Posts</h3>
          {popularPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {post.authorAvatar && !anonymousMode ? (
                        <AvatarImage src={post.authorAvatar} />
                      ) : (
                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm font-medium">
                      {anonymousMode ? "Anonymous" : post.author}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {post.forum}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{post.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}