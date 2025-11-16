import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/config';

// Define types for clarity
export interface Therapist {
  id: string;
  name: string;
  email: string;
  specialty: string;
  status: string;
  rating: number;
  avatar: string | null;
  joinedAt: string;
}

interface UseAdminWebSocketProps {
  token?: string;
  userType: 'admin' | 'therapist' | 'patient';
  onTherapistUpdate?: (therapists: Therapist[]) => void;
  onUserUpdate?: (users: any[]) => void;
  onStatsUpdate?: (stats: any) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
}

export default function useAdminWebSocket({
  token,
  userType,
  onTherapistUpdate,
  onUserUpdate,
  onStatsUpdate,
  onConnectionChange,
  onError
}: UseAdminWebSocketProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!token) return;

    try {
      // Create WebSocket connection
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${apiUrl.replace(/^https?:\/\//, '')}/ws/${userType}`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      const wsConnection = new WebSocket(wsUrl);

      wsConnection.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setError(null);
        
        // Send authentication message
        wsConnection.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
        
        if (onConnectionChange) {
          onConnectionChange(true);
        }
      };

      wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'therapist_update' && onTherapistUpdate) {
            onTherapistUpdate(data.data);
          } 
          else if (data.type === 'user_update' && onUserUpdate) {
            onUserUpdate(data.data);
          } 
          else if (data.type === 'stats_update' && onStatsUpdate) {
            onStatsUpdate(data.data);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };

      wsConnection.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        if (onConnectionChange) {
          onConnectionChange(false);
        }
      };

      wsConnection.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnected(false);
        if (onError) {
          onError('Failed to connect to real-time updates.');
        }
      };

      setSocket(wsConnection);

      // Clean up function
      return () => {
        if (wsConnection) {
          wsConnection.close();
        }
      };
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      setError(`Failed to set up WebSocket: ${err instanceof Error ? err.message : 'Unknown error'}`);
      if (onError) {
        onError('Failed to initialize real-time updates.');
      }
    }
  }, [token, userType, onTherapistUpdate, onUserUpdate, onStatsUpdate, onConnectionChange, onError]);

  // Function to fetch therapists manually (fallback to HTTP)
  const fetchTherapists = useCallback(async () => {
    if (!token) {
      if (onError) onError('Authentication token not available');
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make a GET request to fetch therapists
      const response = await fetch(`${apiUrl}/api/debug/doctors`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch therapists: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.doctors) {
        const formattedTherapists: Therapist[] = data.doctors.map((doctor: any) => ({
          id: doctor._id,
          name: doctor.fullName || doctor.username || doctor.email.split('@')[0],
          email: doctor.email || '',
          specialty: doctor.specialization || doctor.specialty || 'General',
          status: doctor.verified ? "verified" : doctor.status === "suspended" ? "suspended" : "pending",
          rating: doctor.rating || (doctor.verified ? 4.5 : 0),
          avatar: doctor.profileImage || doctor.avatarUrl || null,
          joinedAt: doctor.createdAt || new Date().toISOString()
        }));
        
        if (onTherapistUpdate) {
          onTherapistUpdate(formattedTherapists);
        }
      } else {
        if (onError) onError('No therapist data found');
      }
    } catch (err) {
      console.error('Error fetching therapists:', err);
      if (onError) {
        onError(err instanceof Error ? err.message : 'Error fetching data');
      }
    }
  }, [token, onTherapistUpdate, onError]);

  // Function to fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    if (!token) {
      if (onError) onError('Authentication token not available');
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Fetch counts for different entities
      const [doctorsResponse, patientsResponse, sessionsResponse] = await Promise.all([
        fetch(`${apiUrl}/api/debug/doctors/count`, { headers }),
        fetch(`${apiUrl}/api/debug/patients/count`, { headers }),
        fetch(`${apiUrl}/api/debug/sessions/count`, { headers })
      ]);
      
      const doctorsData = await doctorsResponse.json();
      const patientsData = await patientsResponse.json();
      const sessionsData = await sessionsResponse.json();
      
      if (doctorsData.success && patientsData.success && sessionsData.success) {
        const stats = {
          totalTherapists: doctorsData.count || 0,
          totalUsers: patientsData.count || 0,
          totalSessions: sessionsData.count || 0,
          crisisAlerts: Math.floor(Math.random() * 10) // Mock data for now
        };
        
        if (onStatsUpdate) {
          onStatsUpdate(stats);
        }
        
        return stats;
      } else {
        throw new Error('Failed to fetch complete stats data');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      if (onError) {
        onError(err instanceof Error ? err.message : 'Error fetching stats');
      }
      return null;
    }
  }, [token, onStatsUpdate, onError]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      
      // Re-run the useEffect by forcing a state update
      setTimeout(() => {
        setError(null);
      }, 500);
    }
  }, [socket]);

  return {
    isConnected,
    error,
    reconnect,
    fetchTherapists,
    fetchDashboardStats
  };
}