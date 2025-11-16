"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, User, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { userIdKey, apiUrl } from "@/lib/config";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

interface PatientSubmission {
  _id: string;
  patientName: string;
  patientEmail: string;
  appointmentRequestDate: string;
  mentalHealthConcern?: string;
  status: string;
}

export function NewPatientSubmissions() {
  const [submissions, setSubmissions] = useState<PatientSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewSubmissions = async () => {
      try {
        setLoading(true);
        
        // Get doctor ID from multiple possible storage locations
        const doctorId = localStorage.getItem('doctor_id') || 
                        localStorage.getItem(userIdKey) || 
                        localStorage.getItem('mindguard_user_id') ||
                        localStorage.getItem('doctorId');
                        
        if (!doctorId) {
          // Try to extract from stored doctor object
          const storedDoctorJSON = localStorage.getItem('doctor');
          if (storedDoctorJSON) {
            try {
              const doctorData = JSON.parse(storedDoctorJSON);
              if (doctorData && (doctorData.id || doctorData._id)) {
                const extractedId = doctorData.id || doctorData._id;
                console.log('Extracted doctor ID from stored doctor object:', extractedId);
                
                // Store for future use
                localStorage.setItem('doctor_id', extractedId);
                localStorage.setItem('mindguard_user_id', extractedId);
                localStorage.setItem('doctorId', extractedId);
                
                // Continue with the extracted ID
                fetchWithDoctorId(extractedId);
                return;
              }
            } catch (err) {
              console.error('Error parsing doctor JSON:', err);
            }
          }
          
          setError("Doctor ID not found. Please log in again.");
          setLoading(false);
          return;
        }
        
        fetchWithDoctorId(doctorId);
      } catch (error) {
        console.error("Error fetching new patient submissions:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
        setLoading(false);
      }
    };
    
    const fetchWithDoctorId = async (doctorId: string) => {
      try {
        // Get auth token from multiple possible storage locations
        const token = localStorage.getItem('doctor_token') || 
                     localStorage.getItem('mindguard_token') || 
                     localStorage.getItem('token');
                     
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }
        
        // Format token properly with Bearer prefix if it doesn't have it
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        console.log(`Making API request for pending registrations with doctorId: ${doctorId}`);
        
        // Use the patient-registrations endpoint directly with status=pending
        const response = await fetch(`${apiUrl}/api/patient-registrations/doctor-patients?status=pending&doctorId=${doctorId}`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error(`API request failed with status: ${response.status}`);
          throw new Error(`Failed to fetch patient registrations: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Pending registrations data:', data);
        
        if (data.success && data.data && Array.isArray(data.data.registrations)) {
          const pendingRegistrations = data.data.registrations;
          // Convert to the format expected by the component
          const formattedSubmissions = pendingRegistrations.map((reg: any) => ({
            _id: reg._id,
            patientName: reg.patientName,
            patientEmail: reg.patientEmail,
            appointmentRequestDate: reg.createdAt,
            mentalHealthConcern: reg.symptoms,
            status: 'pending'
          }));
          
          setSubmissions(formattedSubmissions);
        } else {
          setSubmissions([]);
        }
      } catch (error) {
        console.error("Error in fetchWithDoctorId:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
        
        // Show toast notification for any error
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load patient submissions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchNewSubmissions();
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchNewSubmissions, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <Card className="col-span-full md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            <span>New Patient Submissions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            <span>New Patient Submissions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full md:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <span>Pending Patient Registrations</span>
          {submissions.length > 0 && (
            <Badge className="ml-2 bg-primary">{submissions.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No pending patient registrations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission._id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {submission.patientName.split(' ').map(name => name[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{submission.patientName}</p>
                    <Badge>Pending</Badge>
                  </div>
                  
                  {submission.mentalHealthConcern && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {submission.mentalHealthConcern}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Submitted on {new Date(submission.appointmentRequestDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="pt-2">
              <Link href="/doctor/patients">
                <Button className="w-full" variant="outline">
                  Manage Patient Registrations
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 