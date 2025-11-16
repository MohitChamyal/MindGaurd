"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Download, FileText, MapPin, Pill, Video } from "lucide-react";
import { useEffect, useState } from "react";

console.log(Button, Card); // Check if they are defined

interface Consultation {
  id: number;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  status: string;
  avatar: string;
}

const doctors = [
  {
    id: 1,
    name: "Dr. Devanshu Sharma",
    specialty: "Psychiatrist",
    rating: 4.9,
    reviews: 124,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=256&h=256&auto=format&fit=crop",
    available: true,
    bookingLink: "https://cal.com/devanshu-sharma-9noi9z"
  },
  {
    id: 2,
    name: "Dr. Priyanshu Thapliyal",
    specialty: "Therapist",
    rating: 4.8,
    reviews: 98,
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=256&h=256&auto=format&fit=crop",
    available: true,
    bookingLink: "https://cal.com/pandathap"
  }
];

export function ConsultationCalendar() {
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchBookings = () => {
      fetch("/api/get-bookings")
        .then((res) => res.json())
        .then((data) => setBookings(data.bookings))
        .catch((err) => console.error("Error fetching bookings:", err));
    };

    fetchBookings();

    // Poll for new bookings every 10 seconds
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBooking = () => {
    if (selectedDoctor) {
      window.location.href = selectedDoctor.bookingLink;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium">Select Provider</p>
          <div className="space-y-3">
            {doctors.map((doctor) => (
              <Card 
                key={doctor.id} 
                className={`cursor-pointer transition-colors ${selectedDoctor?.id === doctor.id ? 'border-primary' : ''}`}
                onClick={() => setSelectedDoctor(doctor)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={doctor.avatar} />
                      <AvatarFallback>{doctor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{doctor.name}</p>
                        {doctor.available && (
                          <Badge variant="outline" className="text-xs">Available</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span className="text-amber-500">★</span> {doctor.rating} ({doctor.reviews} reviews)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Button 
        className="w-full" 
        disabled={!selectedDoctor}
        onClick={handleBooking}
      >
        Book Appointment
      </Button>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Consultation History</h2>
        {bookings.length === 0 ? (
          <p className="text-muted-foreground text-center">No upcoming consultations.</p>
        ) : (
          bookings.map((booking, index) => (
            <Card key={index} className="mt-4">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={booking.avatar} />
                    <AvatarFallback>{booking.doctor[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{booking.doctor}</p>
                    <p className="text-xs text-muted-foreground">{booking.specialty}</p>
                    <p className="text-xs text-muted-foreground">{booking.date} at {booking.time}</p>
                    <Badge variant="outline" className="text-xs">{booking.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function ConsultationHistory({ consultations = [] }: { consultations?: Consultation[] }) {
  return (
    <div>
      <h3>Your Consultation History</h3>
      {consultations.length === 0 ? (
        <p>No past bookings</p>
      ) : (
        consultations.map((consultation) => (
          <Card key={consultation.id}>
            <CardContent>
              <div>
                <Avatar>
                  <AvatarImage src={consultation.avatar} />
                  <AvatarFallback>{consultation.doctor.charAt(0)}</AvatarFallback>
                </Avatar>
                <p>{consultation.doctor}</p>
                <p>{consultation.specialty}</p>
                <p>{consultation.date} at {consultation.time}</p>
                <Badge>{consultation.type}</Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
