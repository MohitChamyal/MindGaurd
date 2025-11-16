"use client";

import { useRouter } from "next/navigation";
import { PatientForm } from "@/components/doctor/patient-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AddPatientPage() {
  const router = useRouter();
  
  const handleSuccess = () => {
    router.push("/doctor/patients");
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Patient</CardTitle>
          <CardDescription>
            Enter the patient details to add them to your patient list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
} 