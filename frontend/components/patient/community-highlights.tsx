"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, ThumbsUp, Users } from "lucide-react";

const posts = [
  {
    id: 1,
    author: "Anonymous",
    group: "Anxiety Support",
    title: "How I overcame panic attacks",
    preview: "After struggling for years, I finally found a technique that works for me...",
    likes: 24,
    comments: 8,
    time: "2 hours ago"
  },
  {
    id: 2,
    author: "Maria S.",
    group: "Depression Recovery",
    title: "Small wins worth celebrating",
    preview: "Today I managed to go for a walk and it felt like a huge accomplishment...",
    likes: 42,
    comments: 15,
    time: "Yesterday"
  },
  {
    id: 3,
    author: "Dr. Johnson",
    group: "Ask a Professional",
    title: "Understanding medication side effects",
    preview: "Many patients ask about common side effects. Here's what you should know...",
    likes: 56,
    comments: 23,
    time: "2 days ago"
  }
];

export function CommunityHighlights() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Community Highlights</CardTitle>
            <CardDescription>Popular discussions from your groups</CardDescription>
          </div>
          <Button variant="outline" size="sm">Join a Group</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author === "Anonymous" ? "" : `https://i.pravatar.cc/150?u=${post.id}`} />
                    <AvatarFallback>{post.author[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{post.author}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="mr-1 h-3 w-3" />
                      {post.group}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{post.time}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{post.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{post.preview}</p>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <ThumbsUp className="mr-1 h-3 w-3" />
                  {post.likes}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  {post.comments}
                </div>
              </div>
              {post.id !== posts.length && <div className="border-t my-3"></div>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}