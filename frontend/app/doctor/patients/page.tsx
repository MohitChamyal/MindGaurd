"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PatientList } from "@/components/doctor/patient-list";
import { PatientRegistrations } from "@/components/doctor/patient-registrations";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { userIdKey } from "@/lib/config";
import { toast } from "@/components/ui/use-toast";

export default function PatientsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh patient data
  const refreshPatientData = async () => {
    try {
      setIsRefreshing(true);
      
      // Get doctor ID from localStorage
      const doctorId = localStorage.getItem(userIdKey);
      if (!doctorId) {
        toast({
          title: "Error",
          description: "Doctor ID not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      
      // Get auth token - Check both keys
      const token = localStorage.getItem('mindguard_token') || localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      
      // Format token properly with Bearer prefix if it doesn't have it
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // For debugging
      console.log('Using token for refresh:', authToken);
      console.log('Doctor ID:', doctorId);
      
      // Update refreshTrigger to reload patient registrations component
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Success",
        description: "Patient data refreshed successfully",
      });
    } catch (error) {
      console.error("Error refreshing patient data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh patient data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Refresh data on initial mount
  useEffect(() => {
    refreshPatientData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Management</h1>
          <p className="text-muted-foreground">
            View and manage all your patient appointments and records
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={refreshPatientData}
            disabled={isRefreshing}
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          
          <Link href="/doctor/patients/add">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Patient
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registrations">Registration Requests</TabsTrigger>
          <TabsTrigger value="appointments">Current Patients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registrations" className="space-y-4">
          <PatientRegistrations />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <PatientList key={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
}