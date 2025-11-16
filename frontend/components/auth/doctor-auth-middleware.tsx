'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export function DoctorAuthMiddleware({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is logged in and is a doctor
    console.log('DoctorAuthMiddleware: Checking authentication...');
    
    // Check all possible token storage locations
    const token = localStorage.getItem('doctor_token') || 
                 localStorage.getItem('token') || 
                 localStorage.getItem('mindguard_token');
                 
    const userType = localStorage.getItem('userType') || 
                    localStorage.getItem('mindguard_user_type');
    
    let doctorId = localStorage.getItem('doctor_id') || 
                  localStorage.getItem('doctorId') || 
                  localStorage.getItem('mindguard_user_id');
    
    console.log('DoctorAuthMiddleware: Auth check results:', { 
      hasToken: !!token, 
      userType,
      hasDoctorId: !!doctorId
    });
    
    // Check doctor object directly
    const doctorJSON = localStorage.getItem('doctor');
    let doctorData = null;
    
    if (doctorJSON) {
      try {
        doctorData = JSON.parse(doctorJSON);
        console.log('DoctorAuthMiddleware: Found doctor data:', doctorData?.id);
        
        // If we have doctor data but no doctorId, let's store it
        if (doctorData && (doctorData.id || doctorData._id) && !doctorId) {
          const id = doctorData.id || doctorData._id;
          console.log('DoctorAuthMiddleware: Storing missing doctor ID', id);
          localStorage.setItem('doctor_id', id);
          localStorage.setItem('doctorId', id);
          localStorage.setItem('mindguard_user_id', id);
          doctorId = id;
        }
      } catch (e) {
        console.error('DoctorAuthMiddleware: Error parsing doctor data', e);
      }
    }

    // If we have a token but no doctorId, try to extract it from the token
    if (token && !doctorId) {
      try {
        // Parse JWT token to extract doctor ID
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedToken = JSON.parse(window.atob(base64));
        
        console.log('DoctorAuthMiddleware: Token decoded:', decodedToken);
        
        if (decodedToken && (decodedToken.id || (decodedToken.user && decodedToken.user.id))) {
          const tokenDoctorId = decodedToken.id || decodedToken.user.id;
          console.log('DoctorAuthMiddleware: Extracted doctor ID from token:', tokenDoctorId);
          
          // Store for future use
          localStorage.setItem('doctor_id', tokenDoctorId);
          localStorage.setItem('mindguard_user_id', tokenDoctorId);
          localStorage.setItem('doctorId', tokenDoctorId);
          
          doctorId = tokenDoctorId;
        }
      } catch (err) {
        console.error('DoctorAuthMiddleware: Error parsing JWT token:', err);
      }
    }

    if (!token) {
      console.log('DoctorAuthMiddleware: No token found, redirecting to login');
      toast({
        title: "Authentication Required",
        description: "Please log in to access the doctor dashboard",
        variant: "destructive",
      });
      
      setIsAuthenticated(false);
      // Safe navigation with router
      if (router && typeof router.push === 'function') {
        router.push('/doctor-login');
      } else {
        console.error('Router not available, redirecting via window.location');
        window.location.href = '/doctor-login';
      }
      return;
    }
    
    if ((userType !== 'doctor' && !doctorData) || !doctorId) {
      console.log('DoctorAuthMiddleware: Invalid doctor authentication, redirecting to login');
      toast({
        title: "Doctor Access Required",
        description: "This area is only accessible to doctors",
        variant: "destructive",
      });
      
      // Clear any partial authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('doctor_token');
      localStorage.removeItem('mindguard_token');
      
      setIsAuthenticated(false);
      // Safe navigation with router
      if (router && typeof router.push === 'function') {
        router.push('/doctor-login');
      } else {
        console.error('Router not available, redirecting via window.location');
        window.location.href = '/doctor-login';
      }
      return;
    }
    
    // If we got here, all checks passed
    console.log('DoctorAuthMiddleware: Authentication successful, doctorId:', doctorId);
    
    // Make sure all key storage locations are set
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('doctor_token', token);
      localStorage.setItem('mindguard_token', token);
    }
    
    if (doctorId) {
      localStorage.setItem('doctor_id', doctorId);
      localStorage.setItem('doctorId', doctorId);
      localStorage.setItem('mindguard_user_id', doctorId);
    }
    
    localStorage.setItem('userType', 'doctor');
    localStorage.setItem('mindguard_user_type', 'doctor');
    
    setIsAuthenticated(true);
  }, [router]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
} 