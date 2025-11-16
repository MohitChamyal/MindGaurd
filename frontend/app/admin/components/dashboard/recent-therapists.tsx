'use client';

import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; 
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiUrl } from '@/lib/config';
import useAdminWebSocket, { Therapist } from '@/hooks/useAdminWebSocket';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentTherapists() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Get token from localStorage or sessionStorage
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get the token from storage
    const storedToken = localStorage.getItem('token') || 
                       localStorage.getItem('mindguard_token') || 
                       sessionStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Handler for therapist updates from WebSocket
  const handleTherapistUpdate = useCallback((updatedTherapists: Therapist[]) => {
    console.log('Received therapists update:', updatedTherapists);
    if (updatedTherapists && updatedTherapists.length > 0) {
      // Sort by joinedAt date (most recent first) and limit to 4
      const sortedTherapists = [...updatedTherapists]
        .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
        .slice(0, 4);
      
      setTherapists(sortedTherapists);
      setLoading(false);
    }
  }, []);

  // Handle WebSocket connection changes
  const handleConnectionChange = useCallback((isConnected: boolean) => {
    if (isConnected) {
      toast({
        title: "Real-time Updates",
        description: "Connected to admin dashboard updates",
        variant: "default"
      });
    }
  }, [toast]);

  // Handle WebSocket errors
  const handleError = useCallback((error: string) => {
    console.error("WebSocket error:", error);
    toast({ 
      variant: "destructive", 
      title: "Connection Error", 
      description: "Using offline mode for dashboard data" 
    });
  }, [toast]);

  // Initialize WebSocket connection 
  const {
    isConnected,
    error,
    fetchTherapists,
    reconnect
  } = useAdminWebSocket({
    token: token || undefined,
    userType: 'admin',
    onTherapistUpdate: handleTherapistUpdate,
    onConnectionChange: handleConnectionChange,
    onError: handleError
  });

  // Fetch therapist data on initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!isConnected) {
          // If WebSocket is not connected, use HTTP fallback
          await fetchTherapists();
        }
      } catch (error) {
        console.error('Error fetching therapists:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Set up a periodic refresh if WebSocket is not available
    const refreshInterval = !isConnected ? 
      setInterval(async () => {
        await fetchTherapists();
      }, 30000) : null;
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isConnected, fetchTherapists]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setLoading(true);
    await fetchTherapists();
    setLoading(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (therapists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <p className="text-sm text-muted-foreground">No therapists found</p>
        <Button variant="outline" size="sm" onClick={handleManualRefresh}>
          <RefreshCw className="h-3 w-3 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  // Render therapists
  return (
    <div className="space-y-4">
      {therapists.map((therapist) => (
        <div key={therapist.id} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={therapist.avatar || undefined} alt={therapist.name} />
              <AvatarFallback>{therapist.name.charAt(0)}{therapist.name.split(' ')[1]?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">{therapist.name}</p>
              <p className="text-xs text-muted-foreground">{therapist.specialty}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Badge 
              variant={therapist.status === 'verified' ? 'default' : 'secondary'} 
              className="text-xs"
            >
              {therapist.status}
            </Badge>
          </div>
        </div>
      ))}
      
      {!isConnected && (
        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={reconnect} className="h-7 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Connect
          </Button>
        </div>
      )}
    </div>
  );
}