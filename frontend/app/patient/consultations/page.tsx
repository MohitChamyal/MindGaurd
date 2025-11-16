"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsultationCalendar } from "@/components/patient/consultation-calendar";
import { SecureChat } from "@/components/patient/secure-chat";
import { RoomBookingProvider } from "@/lib/hooks/use-room-booking";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Consultations() {
  const [activeTab, setActiveTab] = useState("book");

  return (
    <RoomBookingProvider>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Doctor Consultations</h1>
            <p className="text-muted-foreground">
              Book appointments with licensed therapists and manage your medical support
            </p>
          </div>
          <Button onClick={() => setActiveTab("book")}>Book New Consultation</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Dropdown View */}
          <div className="md:hidden w-full mb-4">
            <Select
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="book">Book Appointment</SelectItem>
                <SelectItem value="chat">Secure Chat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Desktop Tabs View */}
          <TabsList className="grid w-full grid-cols-2 hidden md:grid">
            <TabsTrigger value="book">Book Appointment</TabsTrigger>
            <TabsTrigger value="chat">Secure Chat</TabsTrigger>
          </TabsList>
          
          <TabsContent value="book">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Schedule a Consultation</CardTitle>
                    <CardDescription>
                      Choose between virtual or in-person appointments with our licensed professionals
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="md:hidden">{activeTab === 'book' ? 'Book Appointment' : ''}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ConsultationCalendar />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Secure Messaging</CardTitle>
                    <CardDescription>
                      Follow up with your healthcare providers in a secure environment
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="md:hidden">{activeTab === 'chat' ? 'Secure Chat' : ''}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <SecureChat />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoomBookingProvider>
  );
}
