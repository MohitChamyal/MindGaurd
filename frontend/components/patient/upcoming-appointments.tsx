"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Video, MapPin } from "lucide-react";
import Link from "next/link";

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  avatar?: string;
}

export function UpcomingAppointments() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const userId = localStorage.getItem('mindguard_user_id');
        if (!userId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/consultations/upcoming/${userId}`);
        
        // If endpoint doesn't exist or returns error, use an empty array
        if (!response.ok) {
          console.log('No appointments found or endpoint unavailable');
          setAppointments([]);
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        if (data && Array.isArray(data.appointments)) {
          setAppointments(data.appointments.map((apt: any) => ({
            id: apt._id || apt.id || String(Math.random()),
            doctor: apt.doctorName || 'Dr. Unknown',
            specialty: apt.specialty || 'Therapist',
            date: new Date(apt.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            time: new Date(apt.date).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: apt.sessionType || 'virtual',
            avatar: apt.doctorAvatar
          })));
        } else {
          setAppointments([]);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your scheduled consultations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[180px]">
            <p className="text-muted-foreground">Loading appointments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your scheduled consultations</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
          <p className="text-muted-foreground">No upcoming appointments</p>
          <Button variant="outline" asChild>
            <Link href="/patient/consultations">Book a Consultation</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Upcoming Appointments</CardTitle>
        <CardDescription>Your scheduled consultations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="flex items-start space-x-4 rounded-md border p-3">
              <Avatar>
                <AvatarImage src={appointment.avatar} />
                <AvatarFallback>{appointment.doctor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{appointment.doctor}</p>
                  <div className="flex items-center">
                    {appointment.type === "virtual" ? (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{appointment.specialty}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  {appointment.date} at {appointment.time}
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" asChild>
            <Link href="/patient/consultations">View All Appointments</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}