import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Copy, Mail, Phone, Heart, Calendar, User, FileText, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { apiUrl } from "@/lib/config";

interface PatientProfile {
  _id: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialty?: string;
  patientName: string;
  patientEmail: string;
  patientAge: string;
  patientGender: string;
  mentalHealthConcern?: string;
  medicalHistory?: string;
  currentMedications?: string[];
  allergies?: string[];
  symptoms?: string;
  notes?: string;
  hasCompletedQuestionnaire?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PatientProfileViewProps {
  patientId?: string;
  patient?: PatientProfile;
  onBack?: () => void;
}

export function PatientProfileView({ patientId, patient: initialPatient, onBack }: PatientProfileViewProps) {
  const [patient, setPatient] = useState<PatientProfile | null>(initialPatient || null);
  const [loading, setLoading] = useState(!initialPatient && !!patientId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have a patient object, no need to fetch
    if (initialPatient) {
      setPatient(initialPatient);
      setLoading(false);
      return;
    }
    
    // If no patientId, can't fetch anything
    if (!patientId) {
      setError("No patient ID provided");
      setLoading(false);
      return;
    }

    const fetchPatientProfile = async () => {
      try {
        setLoading(true);
        
        // Get auth token
        const token = localStorage.getItem('mindguard_token') || 
                      localStorage.getItem('doctor_token') || 
                      localStorage.getItem('token');
        
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }
        
        // Format token properly with Bearer prefix
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        // Fetch patient profile data
        const response = await fetch(`${apiUrl}/api/extra-details-patients/${patientId}`, {
          headers: {
            'Authorization': authToken
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient profile');
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
          setPatient(data.data);
          setError(null);
        } else if (data && !data.status) {
          // Handle case where API directly returns the patient object
          setPatient(data);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to fetch patient profile');
        }
      } catch (error) {
        console.error('Error fetching patient profile:', error);
        setError('Unable to load patient profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientProfile();
    }
  }, [patientId, initialPatient]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${text} has been copied to your clipboard.`,
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive"
      });
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-red-500 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p>{error}</p>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No patient profile found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back
        </Button>
      )}

      {/* Header with patient name and status */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{patient.patientName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-muted-foreground">
              ID: {patient._id.substring(0, 8)}...
            </Badge>
            {getStatusBadge(patient.status)}
          </div>
        </div>
      </div>

      {/* Basic Information Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-semibold">{patient.patientName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <div className="flex items-center gap-2">
                <a 
                  href={`mailto:${patient.patientEmail}`} 
                  className="text-blue-500 hover:underline font-semibold"
                >
                  {patient.patientEmail}
                </a>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5" 
                  onClick={() => copyToClipboard(patient.patientEmail)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Age</p>
              <p className="font-semibold">{patient.patientAge || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <p className="font-semibold">{patient.patientGender || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">
                {getStatusBadge(patient.status)}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Questionnaire Completed</p>
              <div className="flex items-center gap-1 mt-1">
                {patient.hasCompletedQuestionnaire ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Yes</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>No</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Added on</p>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <time>
                {patient.createdAt 
                  ? new Date(patient.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) 
                  : 'Date not available'}
              </time>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <a href={`mailto:${patient.patientEmail}`}>
                <Mail className="h-4 w-4 mr-1" />
                Email Patient
              </a>
            </Button>
            <Button size="sm" className="gap-1">
              <MessageSquare className="h-4 w-4 mr-1" />
              Contact Patient
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mental Health Concern Card */}
      {patient.mentalHealthConcern && (
        <Card className="border-l-4 border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Mental Health Concern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{patient.mentalHealthConcern}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Current Symptoms Card */}
      {patient.symptoms && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{patient.symptoms}</p>
          </CardContent>
        </Card>
      )}

      {/* Medical History Card */}
      {patient.medicalHistory && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{patient.medicalHistory}</p>
          </CardContent>
        </Card>
      )}

      {/* Medications Card */}
      {patient.currentMedications && patient.currentMedications.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {patient.currentMedications.map((med, index) => (
                <li key={index}>{med}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Allergies Card */}
      {patient.allergies && patient.allergies.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Allergies</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {patient.allergies.map((allergy, index) => (
                <li key={index}>{allergy}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes Card */}
      {patient.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{patient.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 