"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface Doctor {
  _id: string;
  fullName: string;
  email: string;
  specialty: string;
}

const formSchema = z.object({
  doctorId: z.string().min(1, {
    message: "Doctor ID is required.",
  }),
  medicalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  allergies: z.string().optional(),
  symptoms: z.string().min(1, {
    message: "Please describe your symptoms.",
  }),
  mentalHealthConcern: z.string().min(1, {
    message: "Please describe your mental health concern.",
  }),
  notes: z.string().optional(),
});

export function PatientProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const router = useRouter();

  // Form setup with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doctorId: "",
      medicalHistory: "",
      currentMedications: "",
      allergies: "",
      symptoms: "",
      mentalHealthConcern: "",
      notes: "",
    },
  });

  // Fetch available doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const response = await fetch('/api/doctors');
        
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setDoctors(data);
          
          // Check if we have a scheduled doctor ID in localStorage
          const scheduledDoctorId = localStorage.getItem('scheduled_doctor_id');
          if (scheduledDoctorId) {
            console.log("Found scheduled doctor ID in localStorage:", scheduledDoctorId);
            console.log("Available doctors:", data.map((d: Doctor) => ({ id: d._id, name: d.fullName })));
            form.setValue('doctorId', scheduledDoctorId);
            
            // Verify if the doctor exists in our list
            const doctorExists = data.some((doc: Doctor) => doc._id === scheduledDoctorId);
            if (!doctorExists) {
              console.warn("Scheduled doctor ID not found in available doctors list");
            }
          }
        } else if (data.status === 'success' && Array.isArray(data.data)) {
          setDoctors(data.data);
          
          // Check if we have a scheduled doctor ID in localStorage
          const scheduledDoctorId = localStorage.getItem('scheduled_doctor_id');
          if (scheduledDoctorId) {
            console.log("Found scheduled doctor ID in localStorage:", scheduledDoctorId);
            console.log("Available doctors:", data.data.map((d: Doctor) => ({ id: d._id, name: d.fullName })));
            form.setValue('doctorId', scheduledDoctorId);
            
            // Verify if the doctor exists in our list
            const doctorExists = data.data.some((doc: Doctor) => doc._id === scheduledDoctorId);
            if (!doctorExists) {
              console.warn("Scheduled doctor ID not found in available doctors list");
            }
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast({
          title: "Error",
          description: "Unable to load doctors. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      
      // Get patient data from localStorage
      const patientId = localStorage.getItem('mindguard_user_id');
      const patientName = localStorage.getItem('username');
      const patientEmail = localStorage.getItem('email');
      
      if (!patientId || !patientName || !patientEmail) {
        toast({
          title: "Error",
          description: "Patient information not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      
      // Get auth token
      const token = localStorage.getItem('token') || localStorage.getItem('mindguard_token');
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      
      // Format token properly with Bearer prefix if it doesn't have it
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Get doctor information
      const selectedDoctor = doctors.find(doctor => 
        doctor._id === values.doctorId || 
        (doctor._id?.toString() === values.doctorId) || 
        (doctor.id?.toString() === values.doctorId)
      );
      
      // If doctor not found, log warning
      if (!selectedDoctor) {
        console.warn("Selected doctor not found in doctors list. ID:", values.doctorId);
      } else {
        console.log("Found doctor:", selectedDoctor);
      }
      
      // Format medications and allergies as arrays
      const formattedData = {
        ...values,
        patientId,
        patientName,
        patientEmail,
        doctorName: selectedDoctor ? selectedDoctor.fullName : '',
        doctorSpecialty: selectedDoctor ? selectedDoctor.specialty : '',
        currentMedications: values.currentMedications ? values.currentMedications.split(',').map(m => m.trim()) : [],
        allergies: values.allergies ? values.allergies.split(',').map(a => a.trim()) : [],
        // Set hasCompletedQuestionnaire to true to indicate this profile is complete
        hasCompletedQuestionnaire: true,
        // Ensure appointment status is set
        status: 'confirmed'
      };
      
      console.log("Submitting patient data to doctor:", formattedData);
      
      // First check if a record already exists for this doctor-patient combination
      const checkExistingResponse = await fetch(`/api/patient-exists?doctorId=${values.doctorId}&patientId=${patientId}`, {
        headers: {
          'Authorization': authToken
        }
      });
      
      if (checkExistingResponse.ok) {
        const { exists, recordId } = await checkExistingResponse.json();
        
        if (exists && recordId) {
          console.log("Existing record found, updating instead of creating new one. ID:", recordId);
          
          // Update existing record
          const updateResponse = await fetch(`/api/extra-details-patients/${recordId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authToken,
            },
            body: JSON.stringify(formattedData)
          });
          
          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'Failed to update existing patient details');
          }
          
          const updateData = await updateResponse.json();
          console.log("Patient record updated successfully:", updateData);
        } else {
          // Create new record
          const response = await fetch('/api/extra-details-patients', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authToken,
            },
            body: JSON.stringify(formattedData)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create patient details');
          }
          
          const data = await response.json();
          console.log("Patient record created successfully:", data);
        }
      } else {
        // Fallback to direct creation if check fails
        const response = await fetch('/api/extra-details-patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken,
          },
          body: JSON.stringify(formattedData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to submit patient details');
        }
        
        const data = await response.json();
        console.log("Patient record created successfully:", data);
      }
      
      // Call notification API to alert doctor
      try {
        await fetch('/api/notify-doctor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken
          },
          body: JSON.stringify({
            doctorId: values.doctorId,
            patientName,
            message: 'A patient has completed their profile and is ready for consultation.'
          })
        });
        console.log("Doctor notification sent");
      } catch (notifyError) {
        console.error("Failed to notify doctor, but profile was saved:", notifyError);
      }
      
      toast({
        title: "Success",
        description: "Your details have been sent to the doctor successfully",
      });
      
      // Reset the form
      form.reset();
      
      // Clear the scheduled doctor ID from localStorage
      localStorage.removeItem('scheduled_doctor_id');
      
      // Redirect to patient dashboard
      router.push('/patient');
    } catch (error) {
      console.error('Error submitting patient details:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit patient details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Your Details to Doctor</CardTitle>
        <CardDescription>
          Fill out this form to share your medical details with the doctor you want to consult.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Doctor</FormLabel>
                  <Select
                    disabled={loadingDoctors}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingDoctors ? "Loading doctors..." : "Select a doctor"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id}>
                          {doctor.fullName} - {doctor.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the doctor you want to share your medical details with.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="mentalHealthConcern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mental Health Concern</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your mental health concerns"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Symptoms</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your current symptoms"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="medicalHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical History</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your medical history"
                      className="min-h-[100px]"
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
                    Enter allergies separated by commas (e.g. Penicillin, Aspirin)
                  </FormDescription>
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
                      placeholder="Any additional information you'd like to share"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Details"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 