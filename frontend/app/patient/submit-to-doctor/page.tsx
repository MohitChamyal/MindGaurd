"use client";

import { PatientProfileForm } from "@/components/patient/patient-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitToDoctorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and is a patient
    const token = localStorage.getItem('token') || localStorage.getItem('mindguard_token');
    const userId = localStorage.getItem('mindguard_user_id');
    const userType = localStorage.getItem('userType');
    
    if (!token || !userId) {
      // Not logged in, redirect to login
      router.push('/login');
      return;
    }
    
    if (userType !== 'patient') {
      // Not a patient, redirect to home
      router.push('/');
      return;
    }
    
    setIsAuthenticated(true);
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Share Your Details With a Doctor</CardTitle>
          <CardDescription>
            Fill out this form with your medical information to submit to a specific doctor. 
            You will need the doctor's ID to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground mb-6">
            <p className="mb-2">
              <strong>How it works:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fill out the form with your medical information</li>
              <li>Enter the doctor's ID (you can get this from the doctor directly)</li>
              <li>Submit the form to send your details to the doctor</li>
              <li>The doctor will be able to view your profile and contact you</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <PatientProfileForm />
    </div>
  );
} 