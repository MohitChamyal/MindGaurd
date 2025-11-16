import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, Mail, Phone, Clock, AlertCircle, CheckCircle, XCircle, FileText, Heart, Trash2, RefreshCw, Loader2, Users } from "lucide-react";
import { userIdKey, apiUrl } from "@/lib/config";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PatientProfileView } from "./patient-profile-view";

interface PatientDetails {
  _id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  patientName: string;
  patientEmail: string;
  patientAge: string;
  patientGender: string;
  hasCompletedQuestionnaire?: boolean;
  mentalHealthConcern?: string;
  appointmentRequestDate?: string;
  status?: string;
  medicalHistory?: string;
  currentMedications?: string[];
  allergies?: string[];
  symptoms?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  source?: string;
}

interface PatientRegistration {
  _id: string;
  patientName: string;
  patientEmail: string;
  patientAge: string;
  patientGender: string;
  medicalHistory: string;
  currentMedications: string[];
  allergies: string[];
  symptoms: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialty?: string;
}

export function PatientList() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPatientSource, setSelectedPatientSource] = useState<string | null>(null);
  const [patientSourceCounts, setPatientSourceCounts] = useState({
    registrations: 0,
    extraDetails: 0,
    total: 0
  });

  const fetchDoctorId = useCallback(() => {
    // Try multiple localStorage keys for doctor ID
    const storedDoctorId = 
      localStorage.getItem('doctor_id') || 
      localStorage.getItem('doctorId') || 
      localStorage.getItem('mindguard_user_id') || 
      localStorage.getItem(userIdKey);
    
    if (storedDoctorId) {
      console.log('Using doctor ID:', storedDoctorId);
      setDoctorId(storedDoctorId);
      return storedDoctorId;
    }
    
      setError("Doctor ID not found. Please log in again.");
    return null;
  }, []);

  const getAuthToken = useCallback(() => {
    // Try different token storage locations
    const token = localStorage.getItem('doctor_token') || 
                 localStorage.getItem('mindguard_token') || 
                 localStorage.getItem('token');
                 
    if (!token) {
      console.error('Authentication token not found');
      setError("Authentication token not found. Please log in again.");
      throw new Error('Authentication token not found');
    }
    
    // Format token properly
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }, []);

  const fetchApprovedRegistrations = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      const authToken = getAuthToken();
      
      // 1. Fetch approved registrations from patient-registrations API
      console.log('Fetching approved registrations for doctor ID:', id);
      
      // Use the patient-registrations endpoint with status=approved filter
      const registrationsResponse = await fetch(`${apiUrl}/api/patient-registrations/doctor-patients?status=approved&doctorId=${id}`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      // 2. Fetch patients from extra-details-patients API
      console.log('Fetching extra details patients for doctor ID:', id);
      let extraDetailsResponse: Response | null = null;
      try {
        extraDetailsResponse = await fetch(`${apiUrl}/api/extra-details-patients/doctor/${id}`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
        console.log('Extra details response status:', extraDetailsResponse.status);
      } catch (error) {
        console.error('Error fetching extra details patients:', error);
      }
      
      // Process registrations data
      let registrationsData: PatientDetails[] = [];
      if (registrationsResponse.ok) {
        const data = await registrationsResponse.json();
        console.log('Approved registrations data:', data);
        
        if (data.success && data.data && Array.isArray(data.data.registrations)) {
          // Convert registrations to patient details format
          registrationsData = data.data.registrations.map((reg: PatientRegistration) => ({
            _id: reg._id,
            doctorId: reg.doctorId,
            doctorName: reg.doctorName || '',
            doctorSpecialty: reg.doctorSpecialty || '',
            patientName: reg.patientName,
            patientEmail: reg.patientEmail,
            patientAge: reg.patientAge,
            patientGender: reg.patientGender,
            mentalHealthConcern: reg.symptoms,
            medicalHistory: reg.medicalHistory,
            currentMedications: reg.currentMedications,
            allergies: reg.allergies,
            status: reg.status,
            hasCompletedQuestionnaire: false,
            appointmentRequestDate: reg.createdAt,
            createdAt: reg.createdAt,
            source: 'patient-registrations'  // Mark the source for reference
          }));
        }
      } else {
        console.log('Failed to fetch approved registrations:', registrationsResponse.status);
      }
      
      // Process extra details data
      let extraDetailsData: PatientDetails[] = [];
      if (extraDetailsResponse && extraDetailsResponse.ok) {
        try {
          const data = await extraDetailsResponse.json();
          console.log('Extra details patients data:', data);
          
          // Filter for approved/accepted patients - handle both status terms
          if (Array.isArray(data)) {
            // The data is directly an array
            extraDetailsData = data
              .filter((p: PatientDetails) => 
                p.status === 'accepted' || p.status === 'approved' || p.status === 'active'
              )
              .map((p: PatientDetails) => ({
                ...p,
                source: 'extra-details-patients' // Mark the source for reference
              }));
          } else if (data.status === 'success' && Array.isArray(data.data)) {
            // The data is nested in a data property
            extraDetailsData = data.data
              .filter((p: PatientDetails) => 
                p.status === 'accepted' || p.status === 'approved' || p.status === 'active'
              )
              .map((p: PatientDetails) => ({
                ...p,
                source: 'extra-details-patients' // Mark the source for reference
              }));
          }
        } catch (error) {
          console.error('Error parsing extra details patients response:', error);
        }
      } else {
        // If extraDetailsResponse is not available or not OK, try direct route
        console.log('Failed to fetch extra details patients or response not available. Trying direct route...');
        try {
          const directResponse = await fetch(`${apiUrl}/api/extra-details-patients`, {
            headers: {
              'Authorization': authToken,
              'Content-Type': 'application/json'
            }
          });
          
          if (directResponse.ok) {
            const data = await directResponse.json();
            console.log('Extra details patients data from direct route:', data);
            
            // Filter for doctor's patients
            if (Array.isArray(data)) {
              extraDetailsData = data
                .filter((p: PatientDetails) => 
                  (p.doctorId === id || String(p.doctorId) === id) && 
                  (p.status === 'accepted' || p.status === 'approved' || p.status === 'active')
                )
                .map((p: PatientDetails) => ({
                  ...p,
                  source: 'extra-details-patients'
                }));
            }
          } else {
            console.log('Failed to fetch extra details patients from direct route:', directResponse.status);
          }
        } catch (directError) {
          console.error('Error fetching extra details patients from direct route:', directError);
        }
      }
      
      // Log counts before merging
      console.log(`Source counts: Registrations: ${registrationsData.length}, ExtraDetails: ${extraDetailsData.length}`);
      
      // Merge data from both sources
      // Create a map to avoid duplicates based on email
      const emailMap = new Map<string, PatientDetails>();
      
      // First add all registration patients (they take priority)
      registrationsData.forEach(patient => {
        if (patient.patientEmail) {
          emailMap.set(patient.patientEmail, patient);
        }
      });
      
      // Then add extra details patients if they don't already exist
      extraDetailsData.forEach(patient => {
        if (patient.patientEmail && !emailMap.has(patient.patientEmail)) {
          emailMap.set(patient.patientEmail, patient);
        }
      });
      
      // Convert map back to array
      const mergedPatients = Array.from(emailMap.values());
      console.log('Merged patients data:', mergedPatients);
      
      // Update source counts for stats
      setPatientSourceCounts({
        registrations: registrationsData.length,
        extraDetails: extraDetailsData.length,
        total: mergedPatients.length
      });
      
      setPatients(mergedPatients);
      setError(null);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setError('Unable to load patient data. Please try again later.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getAuthToken]);

  const fetchExtraDetailsPatientsData = async (id: string) => {
    try {
      setLoading(true);
      
      // Get auth token from localStorage
      const authToken = getAuthToken();
      
      console.log("Fetching extraDetailsPatients data for doctor ID:", id);
      
      // Make a direct API call to extraDetailsPatients
      const response = await fetch(`${apiUrl}/api/extra-details-patients/doctor/${id}`, {
        headers: {
          'Authorization': authToken
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient data');
      }
      
      const data = await response.json();
      console.log("Received extraDetailsPatients data:", data);
      
      // Filter for approved patients only - handle multiple valid status terms
      let patientList: PatientDetails[] = [];
      
      if (data.status === 'success' && data.data && Array.isArray(data.data)) {
        patientList = data.data.filter((p: PatientDetails) => 
          p.status === 'approved' || p.status === 'accepted' || p.status === 'active'
        ).map((p: PatientDetails) => ({
          ...p,
          source: 'extra-details-patients'
        }));
      } else if (Array.isArray(data)) {
        patientList = data.filter((p: PatientDetails) => 
          p.status === 'approved' || p.status === 'accepted' || p.status === 'active'
        ).map((p: PatientDetails) => ({
          ...p,
          source: 'extra-details-patients'
        }));
      }
      
      console.log("Filtered approved patients:", patientList, `(count: ${patientList.length})`);
      
      // Update patient source counts
      setPatientSourceCounts({
        registrations: 0,
        extraDetails: patientList.length,
        total: patientList.length
      });
      
      setPatients(patientList);
      setError(null);
    } catch (error) {
      console.error('Error fetching extraDetailsPatients data:', error);
      setError('Unable to load patient data. Please try again later.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Function to refresh data
  const refreshData = () => {
    setIsRefreshing(true);
    const id = fetchDoctorId();
    if (id) {
      fetchApprovedRegistrations(id);
    } else {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const id = fetchDoctorId();
    if (id) {
      fetchApprovedRegistrations(id);
    }
  }, [fetchDoctorId, fetchApprovedRegistrations]);

  const updatePatientStatus = async (id: string, status: string) => {
    try {
      // Get auth token
      const authToken = getAuthToken();
      
      const response = await fetch(`${apiUrl}/api/patient-registrations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        body: JSON.stringify({ 
          status,
          doctorId 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update patient status');
      }
      
      // Refresh the data to get updated list
      refreshData();
        
        toast({
          title: "Success",
          description: `Patient status updated to ${status}`,
        });
    } catch (error) {
      console.error('Error updating patient status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update patient status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors">Active</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors">Active</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors">Active</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 transition-colors">Inactive</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 transition-colors">Inactive</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100">Unknown</Badge>;
    }
  };

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <Card key={i} className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </Card>
    ));
  };

  const deletePatient = async (id: string, source?: string) => {
    try {
      setIsDeleting(true);
      
      // Get auth token
      const token = localStorage.getItem('doctor_token') || 
                  localStorage.getItem('mindguard_token') || 
                  localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      // Format token properly with Bearer prefix if it doesn't have it
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Handle deletion based on source
      let endpoint = '';
      if (source === 'patient-registrations') {
        endpoint = `${apiUrl}/api/patient-registrations/${id}/status`;
        
        // For patient registrations, we just update status to 'rejected' instead of deleting
        const response = await fetch(endpoint, {
          method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
          'Authorization': authToken
          },
          body: JSON.stringify({ 
            status: 'rejected',
            doctorId 
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Failed to deactivate patient');
        }
      } else {
        // Default to extraDetailsPatients endpoint
        endpoint = `${apiUrl}/api/extra-details-patients/${id}`;
        
        console.log('Deleting patient with endpoint:', endpoint);
        console.log('Using auth token:', authToken.substring(0, 20) + '...');
        
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Failed to delete patient');
        }
      }
      
      // Update the local state by removing the deleted patient
      setPatients(patients.filter(patient => patient._id !== id));
      
      // Close the dialog
      setShowDeleteDialog(false);
        
        toast({
          title: "Success",
        description: "Patient has been removed successfully",
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete patient",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletePatientId(null);
      setSelectedPatientSource(null);
    }
  };
  
  const confirmDelete = (id: string, source?: string) => {
    setDeletePatientId(id);
    setSelectedPatientSource(source || null);
    setShowDeleteDialog(true);
  };

  if (error) {
  return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Unable to Load Patients</h3>
          <p className="text-muted-foreground text-center mb-6">{error}</p>
          <Button onClick={() => {
            // Clear error and retry
            setError(null);
            refreshData();
          }}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Current Patients</h2>
          <div className="flex items-center text-muted-foreground text-sm mt-1">
            <Users className="h-4 w-4 mr-1" />
            <span>Total: {patientSourceCounts.total} patients</span>
            <span className="mx-2">|</span>
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
              Registration: {patientSourceCounts.registrations}
            </span>
            <span className="mx-2">|</span>
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
              Extra Details: {patientSourceCounts.extraDetails}
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshData}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        renderSkeletons()
      ) : patients.length > 0 ? (
        <div className="grid gap-4">
          {patients.map((patient) => (
            <Card key={patient._id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {patient.patientName.charAt(0).toUpperCase() + (patient.patientName.split(' ')[1]?.[0]?.toUpperCase() || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{patient.patientName}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{patient.patientEmail}</span>
                        </div>
                        <Badge variant="outline" className="hidden sm:inline-flex text-xs">
                          Patient ID: {typeof patient._id === 'string' ? patient._id.substring(0, 8) : ''}
                        </Badge>
                        {patient.source && (
                          <Badge variant="outline" className="text-xs" title={`Data source: ${patient.source}`}>
                            {patient.source === 'patient-registrations' ? 'Registration' : 'Details'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    {getStatusBadge(patient.status)}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => confirmDelete(patient._id, patient.source)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl">
                        <DialogHeader>
                          <DialogTitle>Patient Details</DialogTitle>
                        </DialogHeader>
                        {selectedPatient && selectedPatient._id === patient._id && (
                          <PatientProfileView patient={selectedPatient} />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {patient.patientAge} years, {patient.patientGender === 'male' ? 'Male' : patient.patientGender === 'female' ? 'Female' : 'Other'}
                    </span>
                  </div>
                  
                  {patient.appointmentRequestDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Requested: {new Date(patient.appointmentRequestDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {patient.medicalHistory && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Has Medical History</span>
                    </div>
                  )}
                  
                  {patient.mentalHealthConcern && (
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[200px]" title={patient.mentalHealthConcern}>
                        {patient.mentalHealthConcern}
                    </span>
                  </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Current Patients</h3>
            <p className="text-muted-foreground text-center mb-6">
              You don't have any approved patients yet. Approve registration requests to see them here.
            </p>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this patient? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletePatientId && deletePatient(deletePatientId, selectedPatientSource || undefined)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Patient'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 