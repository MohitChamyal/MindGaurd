import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar, Mail, Briefcase, Star, Clock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { userIdKey, apiUrl } from "@/lib/config";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form schema for validation
const formSchema = z.object({
  patientName: z.string().min(2, {
    message: "Patient name must be at least 2 characters.",
  }),
  patientEmail: z.string().email({
    message: "Please enter a valid email address.",
  }).regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, {
    message: "Please enter a valid email address."
  }),
  patientAge: z.string().min(1, {
    message: "Age is required.",
  }),
  patientGender: z.string().refine(val => ['male', 'female', 'other', 'prefer-not-to-say'].includes(val), {
    message: "Please select a valid gender option."
  }),
  medicalHistory: z.string().optional().default(''),
  currentMedications: z.string().optional().default(''),
  allergies: z.string().optional().default(''),
  symptoms: z.string().optional().default(''),
  notes: z.string().optional().default('')
});

interface Doctor {
  id: string | number;
  _id?: string;
  name: string;
  fullName?: string;
  email: string;
  specialty: string;
  specialization?: string;
  yearsOfExperience: number;
  rating: number;
  reviews: number;
  avatar: string;
  available: boolean;
  bookingLink: string;
}

interface DoctorInfoPopupProps {
  doctor: Doctor;
  onClose: () => void;
  onAppointmentBooked?: (doctor: Doctor) => void;
}

export function DoctorInfoPopup({ doctor, onClose, onAppointmentBooked }: DoctorInfoPopupProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Get logged in patient ID
  useEffect(() => {
    // Get patient ID from localStorage
    const storedPatientId = localStorage.getItem(userIdKey);
    if (storedPatientId) {
      setPatientId(storedPatientId);
    }
  }, []);

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      patientEmail: "",
      patientAge: "",
      patientGender: "",
      medicalHistory: "",
      currentMedications: "",
      allergies: "",
      symptoms: "",
      notes: "",
    },
  });

  // Function to safely open Cal.com URL
  const openCalendarLink = useCallback((url: string) => {
    // Ensure we're opening a valid URL
    try {
      // Use window.open directly instead of relying on Cal.com's embed script
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening calendar link:", error);
      toast({
        title: "Error",
        description: "Could not open booking calendar. Please try again.",
        variant: "destructive"
      });
    }
  }, []);

  const handleChat = () => {
    onClose();
    router.push("/patient/consultations?tab=chat");
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      if (!patientId) {
        throw new Error("Patient ID not found. Please log in again.");
      }

      // Get auth token from localStorage
      const authToken = localStorage.getItem('mindguard_token');
      if (!authToken) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Prepare registration data
      const registrationData = {
        patientId: patientId.toString(), // Ensure string format for MongoDB ObjectId
        doctorId: (doctor._id || doctor.id).toString(), // Use _id if available, otherwise id
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        ...values,
        patientGender: values.patientGender === 'prefer-not-to-say' ? 'other' : values.patientGender, // Map to allowed enum values
        currentMedications: values.currentMedications ? values.currentMedications.split(',').map(med => med.trim()).filter(Boolean) : [],
        allergies: values.allergies ? values.allergies.split(',').map(allergy => allergy.trim()).filter(Boolean) : [],
        registrationType: 'consultation_request',
        status: 'pending'
      };

      console.log('Submitting registration data:', registrationData);

      // Submit registration request
      const response = await fetch(`${apiUrl}/api/patient-registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(registrationData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Registration Submitted",
          description: "Your consultation request has been sent to the doctor.",
        });

        if (onAppointmentBooked) {
          onAppointmentBooked(doctor);
        }

        // Open Cal.com calendar if available
        if (doctor.bookingLink) {
          toast({
            title: "Opening Calendar",
            description: "You will now be redirected to schedule your meeting time.",
          });
          setTimeout(() => {
            openCalendarLink(doctor.bookingLink);
            onClose();
          }, 1500);
        } else {
          onClose();
        }
      } else {
        throw new Error(data.message || "Failed to submit registration");
      }
    } catch (error) {
      console.error("Error submitting registration:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while submitting your registration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] relative flex flex-col overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 rounded-full z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardContent className="p-0 flex flex-col h-full overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-t-lg flex-shrink-0">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={doctor.avatar} />
                <AvatarFallback>{doctor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold">{doctor.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-sm">
                    {doctor.specialty}
                  </Badge>
                  {doctor.available ? (
                    <Badge variant="outline" className="text-sm">Available</Badge>
                  ) : (
                    <Badge variant="outline" className="text-sm text-red-500">Unavailable</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Section - Scrollable */}
          <div className="p-6 space-y-6 overflow-y-auto flex-grow">
            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Contact Information</h4>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-5 w-5" />
                <span>{doctor.email}</span>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Professional Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-5 w-5" />
                  <span>{doctor.specialty}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>{doctor.yearsOfExperience} years of experience</span>
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Rating</h4>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="ml-1 font-medium">{doctor.rating}</span>
                </div>
              </div>
            </div>

            {/* Patient Information Form */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Patient Information</h4>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="patientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="patientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="patient@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="patientAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input placeholder="30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="patientGender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical History</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter medical history"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currentMedications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter medications separated by commas"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter medications separated by commas (e.g. Prozac, Lexapro)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter allergies separated by commas"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter allergies separated by commas (e.g. Penicillin, Peanuts)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symptoms</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter current symptoms"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes or concerns"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-4">
                    <Button 
                      className="flex items-center gap-2 flex-1" 
                      onClick={handleChat}
                      type="button"
                    >
                      <MessageSquare className="h-5 w-5" />
                      Send Message
                    </Button>
                    <Button 
                      className="flex items-center gap-2 flex-1"
                      type="submit"
                      disabled={isLoading}
                    >
                      <Calendar className="h-5 w-5" />
                      {isLoading ? "Submitting..." : "Submit Registration"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 