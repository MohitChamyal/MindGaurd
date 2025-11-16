"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CommunityForums } from "@/components/patient/community-forums";
import { SupportGroups } from "@/components/patient/support-groups";
import  MyPosts  from "@/components/patient/my-posts";


export default function Community() {
  const [activeTab, setActiveTab] = useState("forums");
  const [anonymousMode, setAnonymousMode] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Support</h1>
          <p className="text-muted-foreground">
            Connect with peers, share experiences, and seek advice in a safe environment
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="anonymous-mode" 
              checked={anonymousMode} 
              onCheckedChange={setAnonymousMode} 
            />
            <Label htmlFor="anonymous-mode">Anonymous Mode</Label>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forums">Discussion Forums</TabsTrigger>
          <TabsTrigger value="groups">Support Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="forums">
          <Card>
            <CardHeader>
              <CardTitle>Discussion Forums</CardTitle>
              <CardDescription>
                Browse topics and join conversations with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommunityForums anonymousMode={anonymousMode} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Topic-Based Support Groups</CardTitle>
              <CardDescription>
                Join specialized groups focused on specific mental health topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupportGroups anonymousMode={anonymousMode} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}