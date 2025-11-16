"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock, Filter, MapPin, Video } from "lucide-react";

export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Mock data - in a real app, this would come from an API
  const upcomingAppointments = [
    {
      id: "1",
      patientName: "Sarah Johnson",
      patientImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=128&h=128&auto=format&fit=crop",
      date: "Today",
      time: "9:00 AM",
      status: "confirmed",
      type: "in-person",
      location: "Main Office",
      notes: "Follow-up on anxiety medication",
    },
    {
      id: "2",
      patientName: "Michael Brown",
      patientImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=128&h=128&auto=format&fit=crop",
      date: "Today",
      time: "11:30 AM",
      status: "confirmed",
      type: "video",
      location: "Virtual",
      notes: "Discussing therapy progress",
    },
    {
      id: "3",
      patientName: "Emily Davis",
      patientImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=128&h=128&auto=format&fit=crop",
      date: "Tomorrow",
      time: "2:00 PM",
      status: "pending",
      type: "in-person",
      location: "Main Office",
      notes: "Initial consultation",
    },
    {
      id: "4",
      patientName: "David Wilson",
      patientImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128&h=128&auto=format&fit=crop",
      date: "Tomorrow",
      time: "4:30 PM",
      status: "confirmed",
      type: "video",
      location: "Virtual",
      notes: "Medication review",
    },
  ];

  const pastAppointments = [
    {
      id: "5",
      patientName: "Jennifer Lee",
      patientImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&h=128&auto=format&fit=crop",
      date: "Yesterday",
      time: "10:00 AM",
      status: "completed",
      type: "in-person",
      location: "Main Office",
      notes: "Therapy session",
    },
    {
      id: "6",
      patientName: "Robert Taylor",
      patientImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=128&h=128&auto=format&fit=crop",
      date: "Yesterday",
      time: "3:30 PM",
      status: "completed",
      type: "video",
      location: "Virtual",
      notes: "Follow-up session",
    },
    {
      id: "7",
      patientName: "Lisa Anderson",
      patientImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=128&h=128&auto=format&fit=crop",
      date: "Aug 15, 2025",
      time: "1:00 PM",
      status: "cancelled",
      type: "in-person",
      location: "Main Office",
      notes: "Patient cancelled due to illness",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage your schedule and patient appointments
          </p>
        </div>
        <Button>
          <CalendarClock className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Appointment List</CardTitle>
              <CardDescription>
                View and manage your upcoming and past appointments
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start justify-between space-x-4 rounded-md border p-4"
                  >
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={appointment.patientImage} />
                        <AvatarFallback>{appointment.patientName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>{appointment.date} at {appointment.time}</span>
                          {appointment.type === "video" ? (
                            <Video className="ml-3 mr-1 h-3 w-3" />
                          ) : (
                            <MapPin className="ml-3 mr-1 h-3 w-3" />
                          )}
                          <span>{appointment.location}</span>
                        </div>
                        <p className="text-sm mt-1">{appointment.notes}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          appointment.status === "confirmed"
                            ? "default"
                            : appointment.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {appointment.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="past" className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start justify-between space-x-4 rounded-md border p-4"
                  >
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={appointment.patientImage} />
                        <AvatarFallback>{appointment.patientName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>{appointment.date} at {appointment.time}</span>
                          {appointment.type === "video" ? (
                            <Video className="ml-3 mr-1 h-3 w-3" />
                          ) : (
                            <MapPin className="ml-3 mr-1 h-3 w-3" />
                          )}
                          <span>{appointment.location}</span>
                        </div>
                        <p className="text-sm mt-1">{appointment.notes}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          appointment.status === "completed"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {appointment.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>
              Select a date to view appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">Selected Date: {date?.toLocaleDateString()}</h3>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span className="text-sm">9:00 AM - Sarah Johnson</span>
                  </div>
                  <Badge variant="outline">In-Person</Badge>
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span className="text-sm">11:30 AM - Michael Brown</span>
                  </div>
                  <Badge variant="outline">Video</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}