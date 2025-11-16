"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MusicSessions } from "@/components/patient/music-sessions";
import { TherapyBooking } from "@/components/patient/therapy-booking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MusicTherapy() {
  const [activeTab, setActiveTab] = useState("sessions");
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Music Therapy</h1>
          <p className="text-muted-foreground">
            Professional-led music therapy sessions
          </p>
          <Badge variant="outline" className="mt-2">Premium Feature</Badge>
        </div>
      </div>
      
      {/* Mobile dropdown for small screens */}
      <div className="md:hidden w-full">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sessions">Therapy Sessions</SelectItem>
            <SelectItem value="booking">Book 1-on-1</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Desktop tabs for medium screens and above */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 hidden md:grid">
          <TabsTrigger value="sessions">Therapy Sessions</TabsTrigger>
          <TabsTrigger value="booking">Book 1-on-1</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Music Therapy Sessions</CardTitle>
              <CardDescription>
                Professional-led sessions available online or offline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MusicSessions />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="booking">
          <Card>
            <CardHeader>
              <CardTitle>Book a Therapist</CardTitle>
              <CardDescription>
                Schedule 1-on-1 sessions with certified music therapy professionals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TherapyBooking />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}