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
import { userIdKey } from "@/lib/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface PatientEditPageProps {
  params: {
    id: string;
  };
}

const formSchema = z.object({
  patientName: z.string().min(2, {
    message: "Patient name must be at least 2 characters.",
  }),
  patientEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  patientAge: z.string().min(1, {
    message: "Age is required.",
  }),
  patientGender: z.string().min(1, {
    message: "Gender is required.",
  }),
  medicalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  allergies: z.string().optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

export default function EditPatientPage({ params }: PatientEditPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
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
      status: "",
    },
  });
  
  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setIsFetching(true);
        
        // Get doctor ID from localStorage
        const doctorId = localStorage.getItem(userIdKey);
        if (!doctorId) {
          setError("Doctor ID not found. Please log in again.");
          setIsFetching(false);
          return;
        }
        
        // Get auth token
        const token = localStorage.getItem('mindguard_token');
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setIsFetching(false);
          return;
        }
        
        // Format token properly with Bearer prefix if it doesn't have it
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        // Fetch the patient details
        const response = await fetch(`/api/extra-details-patients/${params.id}`, {
          headers: {
            'Authorization': authToken,
          },
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch patient details");
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
          const patient = data.data;
          
          // Format medications and allergies as comma-separated strings
          const medicationsString = patient.currentMedications && Array.isArray(patient.currentMedications) 
            ? patient.currentMedications.join(', ') 
            : '';
          
          const allergiesString = patient.allergies && Array.isArray(patient.allergies) 
            ? patient.allergies.join(', ') 
            : '';
          
          // Set form values
          form.reset({
            patientName: patient.patientName || '',
            patientEmail: patient.patientEmail || '',
            patientAge: patient.patientAge || '',
            patientGender: patient.patientGender || '',
            medicalHistory: patient.medicalHistory || '',
            currentMedications: medicationsString,
            allergies: allergiesString,
            symptoms: patient.symptoms || '',
            notes: patient.notes || '',
            status: patient.status || '',
          });
        } else {
          throw new Error(data.message || "Failed to fetch patient details");
        }
      } catch (error) {
        console.error("Error fetching patient details:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
        
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch patient details",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };
    
    if (params.id) {
      fetchPatientDetails();
    }
  }, [params.id, form]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      
      // Get the doctor ID from localStorage
      const doctorId = localStorage.getItem(userIdKey);
      
      if (!doctorId) {
        toast({
          title: "Error",
          description: "Doctor ID not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      
      // Get auth token
      const token = localStorage.getItem('mindguard_token');
      
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
      
      // Format medications and allergies as arrays
      const formattedData = {
        ...values,
        doctorId,
        currentMedications: values.currentMedications ? values.currentMedications.split(',').map(m => m.trim()) : [],
        allergies: values.allergies ? values.allergies.split(',').map(a => a.trim()) : [],
      };
      
      const response = await fetch(`/api/extra-details-patients/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(formattedData),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast({
          title: "Success",
          description: "Patient details updated successfully",
        });
        
        // Navigate back to the patient details page
        router.push(`/doctor/patients/${params.id}`);
        
        // Refresh the page data
        router.refresh();
      } else {
        throw new Error(data.message || 'Failed to update patient details');
      }
    } catch (error) {
      console.error('Error updating patient details:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update patient details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Error Loading Patient Details</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push("/doctor/patients")}>
              Return to Patients List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Patient</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>
            Update the patient's details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading patient details...</span>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <Input placeholder="Male/Female/Other" {...field} />
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
                          placeholder="Enter patient's medical history"
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
                          placeholder="Enter patient's symptoms"
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional notes about the patient"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-4 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Patient"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 