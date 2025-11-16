"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { apiUrl, tokenKey } from "@/lib/config";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

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
}

interface PaginationData {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function PatientRegistrations() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<PatientRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);

  // Utility function to create authentication headers
  const createAuthHeader = useCallback(() => {
    // Try different token locations
    const token = localStorage.getItem('doctor_token') || 
                 localStorage.getItem('mindguard_token') || 
                 localStorage.getItem('token');
                 
    if (!token) {
      console.error('Authentication token not found');
      setAuthError(true);
      throw new Error('Authentication token not found');
    }
    
    // Format token properly
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }, []);

  // Check doctor authentication - improved version with token inspection
  const checkDoctorAuth = useCallback(async () => {
    try {
      console.log("checkDoctorAuth: Starting authentication check");
      
      // First check localStorage for doctorId in various formats
      const storedDoctorId = localStorage.getItem('doctor_id') || 
                           localStorage.getItem('mindguard_user_id') ||
                           localStorage.getItem('doctorId');
      
      if (storedDoctorId) {
        console.log('Using stored doctor ID:', storedDoctorId);
        setDoctorId(storedDoctorId);
        return storedDoctorId;
      }
      
      // Next, try to extract doctor ID from stored doctor object
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
            
            setDoctorId(extractedId);
            return extractedId;
          }
        } catch (err) {
          console.error('Error parsing doctor JSON:', err);
        }
      }
      
      // If we still don't have a doctor ID, try to extract from token
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('mindguard_token') || 
                   localStorage.getItem('doctor_token');
                   
      if (token) {
        try {
          // Parse JWT token to extract doctor ID
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decodedToken = JSON.parse(window.atob(base64));
          
          console.log('Token decoded:', decodedToken);
          
          if (decodedToken && (decodedToken.id || (decodedToken.user && decodedToken.user.id))) {
            const tokenDoctorId = decodedToken.id || decodedToken.user.id;
            console.log('Extracted doctor ID from token:', tokenDoctorId);
            
            // Store for future use
            localStorage.setItem('doctor_id', tokenDoctorId);
            localStorage.setItem('mindguard_user_id', tokenDoctorId);
            localStorage.setItem('doctorId', tokenDoctorId);
            
            setDoctorId(tokenDoctorId);
            return tokenDoctorId;
          }
        } catch (err) {
          console.error('Error parsing JWT token:', err);
        }
      }
      
      // As a last resort, try to get it from the API
      try {
        if (token) {
          const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
          const response = await fetch(`${apiUrl}/api/auth/doctor/profile`, {
            headers: {
              'Authorization': authToken
            }
          });
          
          if (response.ok) {
            const profileData = await response.json();
            
            if (profileData && profileData.id) {
              console.log('Retrieved doctor ID from profile API:', profileData.id);
              
              // Store for future use
              localStorage.setItem('doctor_id', profileData.id);
              localStorage.setItem('mindguard_user_id', profileData.id);
              localStorage.setItem('doctorId', profileData.id);
              
              // Also store the full doctor object
              localStorage.setItem('doctor', JSON.stringify(profileData));
              
              setDoctorId(profileData.id);
              return profileData.id;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching doctor profile:', err);
      }
      
      // No doctor data found in localStorage or the API
      console.error('No doctor ID found');
      
      // Display authentication error UI
      setAuthError(true);
      
      // Show toast notification
      toast({
        title: "Authentication Error",
        description: "Doctor ID not found. Please log in again.",
        variant: "destructive"
      });
      
      return null;
    } catch (error) {
      console.error('Error checking doctor authentication:', error);
      setAuthError(true);
      
      // Show toast notification
      toast({
        title: "Authentication Error",
        description: "Failed to verify doctor credentials. Please log in again.",
        variant: "destructive"
      });
      
      return null;
    }
  }, []);

  const fetchRegistrations = useCallback(async (forcedDoctorId?: string) => {
    try {
      // Use either passed ID or state
      const effectiveDoctorId = forcedDoctorId || doctorId;
      
      // Ensure we have a doctorId
      if (!effectiveDoctorId) {
        console.error('Doctor ID not available - redirecting to login');
        setAuthError(true);
        throw new Error('Doctor ID not found. Please log in again.');
      }

      // Log all authentication data for debugging
      console.log('Auth Data Check:');
      console.log('- doctorId state:', doctorId);
      console.log('- effectiveDoctorId:', effectiveDoctorId);
      console.log('- localStorage mindguard_user_id:', localStorage.getItem('mindguard_user_id'));
      console.log('- localStorage doctor_id:', localStorage.getItem('doctor_id'));
      console.log('- localStorage doctorId:', localStorage.getItem('doctorId'));
      console.log('- localStorage token exists:', !!localStorage.getItem('token') || !!localStorage.getItem('mindguard_token') || !!localStorage.getItem('doctor_token'));
      console.log('- localStorage doctor exists:', !!localStorage.getItem('doctor'));

      // Get auth token using utility function
      let authToken;
      try {
        authToken = createAuthHeader();
      } catch (err) {
        // Get fallback token if createAuthHeader fails
        const token = localStorage.getItem('token') || localStorage.getItem('mindguard_token') || localStorage.getItem('doctor_token');
        authToken = token ? `Bearer ${token}` : null;
        
        if (!authToken) {
          console.error('No auth token available - redirecting to login');
          setAuthError(true);
          throw new Error('Authentication token not found. Please log in again.');
        }
      }
      
      // Log the API request we're about to make - using apiUrl instead of relative URL
      const requestUrl = `${apiUrl}/api/patient-registrations/doctor-patients?page=${page}&limit=10${status !== 'all' ? `&status=${status}` : ''}`;
      console.log('Making API request to:', requestUrl);
      console.log('With auth token (first 20 chars):', authToken?.substring(0, 20) + '...');
      
      const response = await fetch(requestUrl, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      
      // Log response status for debugging
      console.log('API response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized - redirect to login
          setAuthError(true);
          throw new Error('Authentication failed. Please log in again.');
        }
        
        const errorData = await response.json().catch(() => ({
          message: `Server error: ${response.status} ${response.statusText}`
        }));
        throw new Error(errorData.message || `Failed to fetch registrations: ${response.status}`);
      }

      const data = await response.json();
      console.log('Registration data received:', data);
      
      if (data.success && data.data && Array.isArray(data.data.registrations)) {
        setRegistrations(data.data.registrations);
        setPagination(data.data.pagination);
      } else {
        console.error('Unexpected data format:', data);
        setRegistrations([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load patient registrations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [doctorId, page, status, createAuthHeader]);

  const updateRegistrationStatus = async (registrationId: string, newStatus: string) => {
    try {
      setUpdatingId(registrationId);
      
      // Get auth token with utility function
      const authToken = createAuthHeader();

      // Make sure we have a doctorId - try getting from localStorage if state is empty
      const effectiveDoctorId = doctorId || 
        localStorage.getItem('doctor_id') || 
        localStorage.getItem('doctorId') || 
        localStorage.getItem('mindguard_user_id');
        
      if (!effectiveDoctorId) {
        setAuthError(true);
        throw new Error('Doctor ID not found. Please log in again.');
      }

      // Log token for debugging (truncated for security)
      console.log('Using token for update (truncated):', 
                 authToken.substring(0, 20) + '...');
      console.log('Doctor ID for update:', effectiveDoctorId);

      const response = await fetch(
        `${apiUrl}/api/patient-registrations/${registrationId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            status: newStatus,
            doctorId: effectiveDoctorId 
          })
        }
      );
      
      // Log response status
      console.log('Update status response:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          setAuthError(true);
          throw new Error('Authentication failed. Please log in again');
        }
        
        const errorData = await response.json().catch(() => ({
          message: `Server error: ${response.status} ${response.statusText}`
        }));
        throw new Error(errorData.message || 'Failed to update registration status');
      }

      const data = await response.json();
      console.log('Update response:', data);
      
      await fetchRegistrations();
      toast({
        title: "Success",
        description: `Registration ${newStatus} successfully`
      });
    } catch (error) {
      console.error('Error updating registration:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update registration status",
        variant: "destructive"
      });
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Try multiple ways to get doctor ID with retry logic
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          // Try to get doctorId from localStorage directly first - check all possible keys
          const localStorageDoctorId = localStorage.getItem('doctor_id') || 
                              localStorage.getItem('mindguard_user_id') ||
                              localStorage.getItem('doctorId');
          
          if (localStorageDoctorId) {
            // Set the doctorId state directly
            console.log('Found doctor ID in localStorage:', localStorageDoctorId);
            setDoctorId(localStorageDoctorId);
            
            // Make sure this ID is saved in all locations
            localStorage.setItem('doctor_id', localStorageDoctorId);
            localStorage.setItem('doctorId', localStorageDoctorId); 
            localStorage.setItem('mindguard_user_id', localStorageDoctorId);
            
            // Fetch data using the direct ID
            await fetchRegistrations(localStorageDoctorId);
            return;
          }
          
          // Try to extract from doctor object
          const doctorJSON = localStorage.getItem('doctor');
          if (doctorJSON) {
            try {
              const doctorData = JSON.parse(doctorJSON);
              const extractedId = doctorData?.id || doctorData?._id;
              
              if (extractedId) {
                console.log('Extracted doctor ID from stored object:', extractedId);
                setDoctorId(extractedId);
                
                // Save to all locations
                localStorage.setItem('doctor_id', extractedId);
                localStorage.setItem('doctorId', extractedId); 
                localStorage.setItem('mindguard_user_id', extractedId);
                
                // Fetch data using this ID
                await fetchRegistrations(extractedId);
                return;
              }
            } catch (e) {
              console.error('Error parsing doctor data from localStorage:', e);
            }
          }
          
          // Try the fallback/token method if direct IDs not found
          const checkedDoctorId = await checkDoctorAuth();
          if (checkedDoctorId) {
            await fetchRegistrations(checkedDoctorId);
            return;
          }
          
          console.log(`Doctor ID retrieval attempt ${retryCount + 1} failed, ${retryCount < maxRetries ? 'retrying...' : 'giving up.'}`);
          retryCount++;
          
          // Wait a bit before retry
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // If we get here, all retries failed
        console.error('Failed to get doctor ID after multiple attempts');
        setLoading(false);
        setAuthError(true);
        
        // Redirect to login as a last resort
        toast({
          title: "Authentication Error",
          description: "Unable to verify your doctor account. Please log in again.",
          variant: "destructive"
        });
        
        // Safe navigation with router
        if (router && typeof router.push === 'function') {
          router.push('/doctor-login');
        } else {
          console.error('Router not available, redirecting via window.location');
          window.location.href = '/doctor-login';
        }
      } catch (error) {
        console.error("Error in initialization:", error);
        setLoading(false);
        setAuthError(true);
      }
    };
    
    init();
  }, [status, page, checkDoctorAuth, router, fetchRegistrations]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex gap-2 items-center"><Clock className="w-4 h-4" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="success" className="flex gap-2 items-center"><CheckCircle className="w-4 h-4" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex gap-2 items-center"><XCircle className="w-4 h-4" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  if (authError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <h3 className="text-xl font-semibold mb-3">Doctor Authentication Required</h3>
          <p className="text-muted-foreground text-center mb-6">
            You need to be logged in as a doctor to view patient registration requests.
            Please log in with your doctor credentials.
          </p>
          <div className="space-y-4 w-full max-w-sm">
            <Button 
              className="w-full" 
              onClick={() => router.push('/doctor-login')}
            >
              Go to Doctor Login
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                // Clear any invalid authentication data
                localStorage.removeItem('token');
                localStorage.removeItem('mindguard_token');
                localStorage.removeItem('doctor_id');
                localStorage.removeItem('mindguard_user_id');
                // Redirect to login
                router.push('/doctor-login');
              }}
            >
              Clear Session & Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Registrations</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {registrations.map((registration) => (
          <Card key={registration._id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl">{registration.patientName}</CardTitle>
                <CardDescription>{registration.patientEmail}</CardDescription>
              </div>
              {getStatusBadge(registration.status)}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Age:</span> {registration.patientAge}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Gender:</span> {registration.patientGender}
                  </div>
                  {registration.symptoms && (
                    <div className="text-sm">
                      <span className="font-medium">Symptoms:</span>
                      <p className="mt-1 text-muted-foreground">{registration.symptoms}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {registration.currentMedications.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Current Medications:</span>
                      <p className="mt-1 text-muted-foreground">{registration.currentMedications.join(', ')}</p>
                    </div>
                  )}
                  {registration.allergies.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Allergies:</span>
                      <p className="mt-1 text-muted-foreground">{registration.allergies.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {registration.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => updateRegistrationStatus(registration._id, 'approved')}
                    disabled={!!updatingId}
                  >
                    {updatingId === registration._id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => updateRegistrationStatus(registration._id, 'rejected')}
                    disabled={!!updatingId}
                  >
                    {updatingId === registration._id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={!pagination.hasMore}
          >
            Next
          </Button>
        </div>
      )}

      {registrations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <p className="text-muted-foreground">No registrations found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}