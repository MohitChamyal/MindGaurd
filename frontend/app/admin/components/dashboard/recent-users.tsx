'use client';

import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiUrl } from '@/lib/config';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: string;
  joinedAt: string;
}

export function RecentUsers() {
  const [users, setUsers] = useState<User[]>([]);
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

  // Function to format relative time string
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (secondsAgo < 60) return 'just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`;
    if (secondsAgo < 2592000) return `${Math.floor(secondsAgo / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  // Fetch users data from the backend
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/api/debug/patients`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.patients) {
        const formattedUsers: User[] = data.patients.map((user: any) => ({
          id: user._id,
          name: user.name || user.username || user.email.split('@')[0],
          email: user.email,
          avatar: user.profileImage || user.avatarUrl || null,
          status: user.status || 'active',
          joinedAt: user.createdAt || new Date().toISOString()
        }));
        
        // Sort by joined date (most recent first) and limit to 4
        const sortedUsers = formattedUsers
          .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
          .slice(0, 4);
        
        setUsers(sortedUsers);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch recent users",
        variant: "destructive"
      });
      setLoading(false);
    }
  }, [token, toast]);

  // Fetch user data on initial load
  useEffect(() => {
    fetchUsers();
    
    // Set up a periodic refresh
    const refreshInterval = setInterval(() => {
      fetchUsers();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, [fetchUsers]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchUsers();
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
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <p className="text-sm text-muted-foreground">No recent users found</p>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-3 w-3 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  // Render users
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}{user.name.split(' ')[1]?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="text-xs">
              {formatRelativeTime(user.joinedAt)}
            </Badge>
          </div>
        </div>
      ))}
      
      <div className="flex justify-end pt-2">
        <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-7 text-xs">
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
    </div>
  );
}