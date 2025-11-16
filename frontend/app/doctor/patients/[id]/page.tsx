"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Calendar, Clock, AlertCircle, CheckCircle, XCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { userIdKey } from "@/lib/config";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

interface PatientDetailsProps {
  params: {
    id: string;
  };
}

interface PatientDetails {
  _id: string;
  doctorId: string;
  patientName: string;
  patientEmail: string;
  patientAge: string;
  patientGender: string;
  medicalHistory?: string;
  currentMedications?: string[];
  allergies?: string[];
  symptoms?: string;
  notes?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  mentalHealthConcern?: string;
}

export default function PatientDetailsPage({ params }: PatientDetailsProps) {
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);
        
        // Get doctor ID from localStorage
        const doctorId = localStorage.getItem(userIdKey);
        if (!doctorId) {
          setError("Doctor ID not found. Please log in again.");
          setLoading(false);
          return;
        }
        
        // Get auth token
        const token = localStorage.getItem('mindguard_token');
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
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
          setPatient(data.data);
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
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchPatientDetails();
    }
  }, [params.id]);
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Patient Details</h3>
            <p className="text-muted-foreground mb-4">{error || "Patient not found"}</p>
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
          <h1 className="text-2xl font-bold">Patient Details</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.refresh()}>
            Refresh
          </Button>
          <Link href={`/doctor/patients/${params.id}/edit`}>
            <Button>
              Edit Patient
            </Button>
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>{patient.patientName}</CardTitle>
            </div>
            {getStatusBadge(patient.status)}
          </div>
          <CardDescription>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4" />
              <span>{patient.patientEmail}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4" />
              <span>Added on {new Date(patient.createdAt).toLocaleDateString()}</span>
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Mental Health Concern - Highlighted prominently */}
          {patient.mentalHealthConcern && (
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h3 className="text-lg font-semibold mb-2 text-primary">Primary Mental Health Concern</h3>
              <p className="text-gray-700">{patient.mentalHealthConcern}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <dl className="space-y-2 bg-gray-50 p-3 rounded-lg shadow-sm">
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Age:</dt>
                  <dd>{patient.patientAge || 'Not specified'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-muted-foreground">Gender:</dt>
                  <dd>{patient.patientGender || 'Not specified'}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Medical History</h3>
              <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
                <p className={`${patient.medicalHistory ? 'text-gray-700' : 'text-muted-foreground italic'}`}>
                  {patient.medicalHistory || "No medical history recorded"}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Current Symptoms</h3>
            <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <p className={`${patient.symptoms ? 'text-gray-700' : 'text-muted-foreground italic'}`}>
                {patient.symptoms || "No symptoms recorded"}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Current Medications</h3>
              <div className="bg-gray-50 p-3 rounded-lg shadow-sm h-full">
                {patient.currentMedications && Array.isArray(patient.currentMedications) && patient.currentMedications.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    {patient.currentMedications.map((medication, index) => (
                      <li key={index}>{medication}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">No medications recorded</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Allergies</h3>
              <div className="bg-gray-50 p-3 rounded-lg shadow-sm h-full">
                {patient.allergies && Array.isArray(patient.allergies) && patient.allergies.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    {patient.allergies.map((allergy, index) => (
                      <li key={index}>{allergy}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">No allergies recorded</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Additional Notes</h3>
            <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <p className={`${patient.notes ? 'text-gray-700' : 'text-muted-foreground italic'}`}>
                {patient.notes || "No additional notes recorded"}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                // Copy patient email to clipboard
                navigator.clipboard.writeText(patient.patientEmail);
                toast({
                  title: "Email Copied",
                  description: "Patient email has been copied to clipboard",
                });
              }}
            >
              Copy Email
            </Button>
            <Button variant="default">
              Contact Patient
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 