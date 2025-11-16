"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Star, CalendarIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export function TherapyBooking() {
  const [therapists] = useState([
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "Anxiety Relief",
      experience: "12 years",
      rating: 4.9,
      reviews: 134,
      availability: "Mon, Wed, Fri",
      imgUrl: "/api/placeholder/100/100",
      initials: "SJ"
    },
    {
      id: 2,
      name: "Michael Chang, MT-BC",
      specialty: "Emotional Processing",
      experience: "8 years",
      rating: 4.7,
      reviews: 98,
      availability: "Tue, Thu, Sat",
      imgUrl: "/api/placeholder/100/100",
      initials: "MC"
    },
    {
      id: 3,
      name: "Emma Roberts, MT-BC",
      specialty: "Sleep Disorders",
      experience: "15 years",
      rating: 4.8,
      reviews: 156,
      availability: "Mon-Fri",
      imgUrl: "/api/placeholder/100/100",
      initials: "ER"
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Find a Therapist</h3>
              <Input placeholder="Search by name or specialty" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Specialty</h3>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="anxiety">Anxiety Relief</SelectItem>
                  <SelectItem value="emotional">Emotional Processing</SelectItem>
                  <SelectItem value="sleep">Sleep Disorders</SelectItem>
                  <SelectItem value="depression">Depression</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Availability</h3>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Day</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                  <SelectItem value="weekends">Weekends</SelectItem>
                  <SelectItem value="evenings">Evenings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="w-full">Apply Filters</Button>
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-4">
          {therapists.map((therapist) => (
            <Card key={therapist.id} className="p-4">
              <div className="flex gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={therapist.imgUrl} />
                  <AvatarFallback>{therapist.initials}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{therapist.name}</h3>
                      <p className="text-sm text-muted-foreground">{therapist.specialty}</p>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
                      <span className="text-sm font-medium">{therapist.rating}</span>
                      <span className="text-xs text-muted-foreground ml-1">({therapist.reviews})</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span>{therapist.availability}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span>{therapist.experience} exp.</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Book Session
                    </Button>
                    <Button variant="outline">View Profile</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          <div className="flex justify-center pt-2">
            <Button variant="outline">View More Therapists</Button>
          </div>
        </div>
      </div>
    </div>
  );
}