"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Calendar,
  Download,
  FileText,
  InfoIcon,
  Mail,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
  Loader2
} from "lucide-react";
import { apiUrl, userIdKey } from "@/lib/config";
import { toast } from "@/components/ui/use-toast";

// Define patient interface based on the PatientDetails from patient-list.tsx
interface PatientDetails {
  _id: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialty?: string;
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

// Define prescription interface
interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define medication suggestion interface
interface MedicationSuggestion {
  medication: string;
  dosage: string;
  frequency: string;
  reason: string;
}

// Constants for localStorage keys
const STORAGE_KEYS = {
  PRESCRIPTIONS: 'mindguard_prescriptions'
};

export default function PrescriptionsPage() {
  // Inject custom scrollbar styles
  useEffect(() => {
    const styleId = 'custom-scrollbar-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1d4730;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2c8a55;
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #1d4730 rgba(0, 0, 0, 0.2);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<PatientDetails[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<MedicationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prescription.medication.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to fetch patient data
  const fetchPatientData = async () => {
    try {
      setLoading(true);

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

      // Get auth token
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

      // Fetch approved patients from registrations
      const registrationsResponse = await fetch(`${apiUrl}/api/patient-registrations/doctor/${doctorId}?status=approved`, {
        headers: {
          'Authorization': authToken
        }
      });

      let allPatients: PatientDetails[] = [];

      if (registrationsResponse.ok) {
        const data = await registrationsResponse.json();

        if (data.success && data.data && Array.isArray(data.data.registrations)) {
          // Convert registrations to patient details format
          const registrationsData = data.data.registrations.map((reg: any) => ({
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
            source: 'patient-registrations'
          }));

          allPatients = [...registrationsData];
        }
      }

      // Also try to fetch from extra-details-patients
      try {
        const extraDetailsResponse = await fetch(`${apiUrl}/api/extra-details-patients/doctor/${doctorId}`, {
          headers: {
            'Authorization': authToken
          }
        });

        if (extraDetailsResponse.ok) {
          const data = await extraDetailsResponse.json();

          // Filter for approved patients only - handle multiple valid status terms
          let extraDetailsData: PatientDetails[] = [];

          if (data.status === 'success' && data.data && Array.isArray(data.data)) {
            extraDetailsData = data.data.filter((p: PatientDetails) =>
              p.status === 'approved' || p.status === 'accepted' || p.status === 'active'
            ).map((p: PatientDetails) => ({
              ...p,
              source: 'extra-details-patients'
            }));
          } else if (Array.isArray(data)) {
            extraDetailsData = data.filter((p: PatientDetails) =>
              p.status === 'approved' || p.status === 'accepted' || p.status === 'active'
            ).map((p: PatientDetails) => ({
              ...p,
              source: 'extra-details-patients'
            }));
          }

          // Merge patients from both sources
          const emailMap = new Map();

          // First add registrations patients
          allPatients.forEach(patient => {
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
          allPatients = Array.from(emailMap.values());
        }
      } catch (err) {
        console.error("Error fetching extra details patients:", err);
      }

      setPatients(allPatients);
      setError(null);
    } catch (err) {
      console.error("Error fetching patient data:", err);
      setError("Failed to load patient data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch prescriptions
  const fetchPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);

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

      // Get auth token
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

      // First try to fetch from API if available
      try {
        // TODO: Implement API call to fetch prescriptions when backend is ready
        // const response = await fetch(`${apiUrl}/api/prescriptions/doctor/${doctorId}`, {
        //   headers: {
        //     'Authorization': authToken
        //   }
        // });

        // if (response.ok) {
        //   const data = await response.json();
        //   if (data.success && data.data) {
        //     setPrescriptions(data.data);
        //     return;
        //   }
        // }

        // If API call fails or is not implemented yet, fall back to localStorage
        const storedPrescriptions = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);

        if (storedPrescriptions) {
          const allPrescriptions = JSON.parse(storedPrescriptions) as Prescription[];
          // Filter prescriptions for the current doctor
          const doctorPrescriptions = allPrescriptions.filter(p => p.doctorId === doctorId);
          setPrescriptions(doctorPrescriptions);
        } else {
          setPrescriptions([]);
        }
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
        // Fall back to localStorage on API error
        const storedPrescriptions = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);

        if (storedPrescriptions) {
          const allPrescriptions = JSON.parse(storedPrescriptions) as Prescription[];
          // Filter prescriptions for the current doctor
          const doctorPrescriptions = allPrescriptions.filter(p => p.doctorId === doctorId);
          setPrescriptions(doctorPrescriptions);
        } else {
          setPrescriptions([]);
        }
      }
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      toast({
        title: "Error",
        description: "Failed to load prescriptions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  // Function to fetch AI medication suggestions
  const fetchAiSuggestions = async (patientId: string) => {
    try {
      // This would be a real API call in a production app
      // For now, we'll just set some placeholder data until the AI API is implemented
      setAiSuggestions([]);

      // TODO: Implement API call to fetch AI suggestions
      // const response = await fetch(`${apiUrl}/api/ai/medication-suggestions/${patientId}`, {
      //   headers: {
      //     'Authorization': authToken
      //   }
      // });

      // if (response.ok) {
      //   const data = await response.json();
      //   if (data.success && data.data) {
      //     setAiSuggestions(data.data);
      //   }
      // }

    } catch (err) {
      console.error("Error fetching AI suggestions:", err);
    }
  };

  // Fetch patient data and prescriptions on component mount
  useEffect(() => {
    fetchPatientData();
    fetchPrescriptions();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle patient selection - modified to update form data
  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p._id === patientId);
    setSelectedPatient(patient || null);

    // If we have a patient, fetch AI suggestions
    if (patient) {
      fetchAiSuggestions(patientId);
    }
  };

  // Use an AI suggestion
  const useAiSuggestion = (suggestion: MedicationSuggestion) => {
    setFormData(prev => ({
      ...prev,
      medication: suggestion.medication,
      dosage: suggestion.dosage,
      frequency: suggestion.frequency
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate required fields
    const errors: string[] = [];

    if (!selectedPatient) {
      errors.push("Please select a patient");
    }

    if (!formData.medication) {
      errors.push("Please select a medication");
    }

    if (!formData.dosage) {
      errors.push("Please enter a dosage");
    }

    if (!formData.frequency) {
      errors.push("Please select a frequency");
    }

    if (!formData.startDate) {
      errors.push("Please select a start date");
    }

    if (!formData.endDate) {
      errors.push("Please select an end date");
    }

    // Check if end date is after start date
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate < startDate) {
        errors.push("End date must be after start date");
      }
    }

    // If there are validation errors, show them and return
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: (
          <ul className="list-disc pl-4">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        ),
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get auth token and doctor ID
      const token = localStorage.getItem('mindguard_token') || localStorage.getItem('token');
      const doctorId = localStorage.getItem(userIdKey);

      if (!token || !doctorId) {
        toast({
          title: "Error",
          description: "Authentication failed. Please log in again.",
          variant: "destructive"
        });
        return;
      }

      // Format token with Bearer prefix if needed
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      // Generate a unique ID for the prescription
      const prescriptionId = `prescription-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create a timestamp for the prescription
      const timestamp = new Date().toISOString();

      // Construct complete prescription data
      const newPrescription: Prescription = {
        id: prescriptionId,
        patientId: selectedPatient._id,
        doctorId: doctorId,
        patientName: selectedPatient.patientName,
        patientEmail: selectedPatient.patientEmail,
        medication: formData.medication,
        dosage: formData.dosage,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'Active',
        notes: formData.notes,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      console.log("Creating prescription:", newPrescription);

      // Try to save to API first
      let savedToApi = false;

      // TODO: Replace with actual API call once backend is ready
      try {
        // const prescriptionResponse = await fetch(`${apiUrl}/api/prescriptions`, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': authToken
        //   },
        //   body: JSON.stringify(newPrescription)
        // });

        // if (prescriptionResponse.ok) {
        //   const responseData = await prescriptionResponse.json();
        //   // If API returns the saved prescription with an ID, use that instead
        //   if (responseData.success && responseData.data && responseData.data.id) {
        //     newPrescription.id = responseData.data.id;
        //   }
        //   savedToApi = true;
        // }
      } catch (apiError) {
        console.error("API save failed, falling back to localStorage:", apiError);
      }

      // If API save failed or is not implemented, save to localStorage as fallback
      if (!savedToApi) {
        // Get existing prescriptions
        const storedPrescriptions = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
        let allPrescriptions: Prescription[] = [];

        if (storedPrescriptions) {
          try {
            allPrescriptions = JSON.parse(storedPrescriptions);
          } catch (parseError) {
            console.error("Error parsing stored prescriptions:", parseError);
            allPrescriptions = []; // Reset if corrupted
          }
        }

        // Add new prescription and save back to localStorage
        allPrescriptions.push(newPrescription);
        localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(allPrescriptions));
      }

      // Create a simplified prescription record for updating the patient
      const prescriptionRecord = {
        id: prescriptionId,
        medication: formData.medication,
        dosage: formData.dosage,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate,
        prescribedDate: timestamp,
        status: 'Active'
      };

      // Update patient's medication history in the database
      // TODO: Replace with actual API call once backend is ready
      let patientUpdated = false;

      try {
        // const patientUpdateResponse = await fetch(`${apiUrl}/api/patients/${selectedPatient._id}/prescriptions`, {
        //   method: 'PUT',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': authToken
        //   },
        //   body: JSON.stringify({
        //     prescription: prescriptionRecord
        //   })
        // });

        // if (patientUpdateResponse.ok) {
        //   patientUpdated = true;
        // }
      } catch (patientUpdateError) {
        console.error("API patient update failed:", patientUpdateError);
      }

      // For now, update the local patient state
      setPatients(prevPatients => {
        return prevPatients.map(patient => {
          if (patient._id === selectedPatient._id) {
            // Create or update the prescriptions array for this patient
            const updatedPatient = { ...patient };

            // Initialize medications array if it doesn't exist
            if (!updatedPatient.currentMedications) {
              updatedPatient.currentMedications = [];
            }

            // Add the new medication to the patient's current medications list if not already there
            if (!updatedPatient.currentMedications.includes(formData.medication)) {
              updatedPatient.currentMedications = [...updatedPatient.currentMedications, formData.medication];
            }

            return updatedPatient;
          }
          return patient;
        });
      });

      // Add to existing prescriptions in state
      setPrescriptions(prev => [newPrescription, ...prev]);

      // Reset form
      setFormData({
        medication: '',
        dosage: '',
        frequency: '',
        startDate: '',
        endDate: '',
        notes: ''
      });

      // Reset selected patient
      setSelectedPatient(null);

      // Show success message with more details
      toast({
        title: "Prescription Created",
        description: (
          <div className="space-y-1">
            <p>Prescription for {selectedPatient.patientName} successfully created.</p>
            <p className="text-xs text-muted-foreground">
              {formData.medication} {formData.dosage}, {formData.frequency}
            </p>
          </div>
        ),
        variant: "default"
      });

      // Close the dialog
      document.querySelector('[aria-label="Close"]')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      );

      // Refresh the prescriptions list after a short delay
      setTimeout(() => {
        refreshPrescriptions();
      }, 500);

    } catch (error) {
      console.error("Error creating prescription:", error);
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to refresh prescription data
  const refreshPrescriptions = () => {
    fetchPrescriptions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground">
            Manage patient prescriptions and medications
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col bg-black border border-green-500/20">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <DialogHeader className="text-white">
                <DialogTitle>Create New Prescription</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Fill in the details for the new prescription
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 overflow-y-auto pr-2 flex-grow">
                {/* Patient Selection */}
                <div className="grid grid-cols-4 items-center gap-4 mb-4">
                  <label htmlFor="patient" className="text-right font-medium text-white">
                    Patient
                  </label>
                  <div className="col-span-3">
                    <Select onValueChange={handlePatientSelect}>
                      <SelectTrigger className="border-green-500/30 focus:ring-green-500/30 bg-black text-white">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto bg-black text-white border-green-500/30">
                        {loading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2 text-green-500" />
                            <span>Loading patients...</span>
                          </div>
                        ) : error ? (
                          <div className="flex items-center justify-center p-4">
                            <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                            <span>{error}</span>
                          </div>
                        ) : patients.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            No patients found
                          </div>
                        ) : (
                          patients.map((patient) => (
                            <SelectItem key={patient._id} value={patient._id} className="focus:bg-green-900/30 focus:text-white">
                              {patient.patientName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Display selected patient details */}
                {selectedPatient && (
                  <div className="mb-4">
                    <div className="bg-black border border-green-500/20 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-800 flex items-center justify-center text-white font-semibold">
                          {selectedPatient.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium text-white">{selectedPatient.patientName}</h3>
                          <div className="text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              <span>{selectedPatient.patientAge} years, {selectedPatient.patientGender}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              <span>{selectedPatient.patientEmail}</span>
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="font-medium text-white">Medical History:</div>
                            <p className="text-sm text-gray-400">{selectedPatient.medicalHistory || 'None'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Layout based on screenshot */}
                <div className="space-y-4">
                  {/* Medication */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="medication" className="text-right font-medium text-white">
                      Medication
                    </label>
                    <div className="col-span-3">
                      <Select
                        onValueChange={(value) => handleInputChange('medication', value)}
                        value={formData.medication}
                      >
                        <SelectTrigger className="border-green-500/30 focus:ring-green-500/30 bg-black text-white">
                          <SelectValue placeholder="Sertraline" />
                        </SelectTrigger>
                        <SelectContent className="bg-black text-white border-green-500/30">
                          <SelectItem value="Sertraline">Sertraline</SelectItem>
                          <SelectItem value="Alprazolam">Alprazolam</SelectItem>
                          <SelectItem value="Escitalopram">Escitalopram</SelectItem>
                          <SelectItem value="Lithium">Lithium</SelectItem>
                          <SelectItem value="Fluoxetine">Fluoxetine</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="mt-1">
                        <div className="text-xs text-green-500 flex items-center cursor-pointer"
                          onClick={() => fetchAiSuggestions(selectedPatient?._id || '')}>
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Medication Suggestions
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dosage */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="dosage" className="text-right font-medium text-white">
                      Dosage
                    </label>
                    <div className="col-span-3">
                      <Input
                        id="dosage"
                        placeholder="e.g., 50mg"
                        className="border-green-500/30 focus:ring-green-500/30 bg-black text-white placeholder:text-gray-500"
                        value={formData.dosage}
                        onChange={(e) => handleInputChange('dosage', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Frequency */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="frequency" className="text-right font-medium text-white">
                      Frequency
                    </label>
                    <div className="col-span-3">
                      <Select
                        onValueChange={(value) => handleInputChange('frequency', value)}
                        value={formData.frequency}
                      >
                        <SelectTrigger className="border-green-500/30 focus:ring-green-500/30 bg-black text-white">
                          <SelectValue placeholder="Three..." />
                        </SelectTrigger>
                        <SelectContent className="bg-black text-white border-green-500/30">
                          <SelectItem value="Once daily">Once daily</SelectItem>
                          <SelectItem value="Twice daily">Twice daily</SelectItem>
                          <SelectItem value="Three times daily">Three times daily</SelectItem>
                          <SelectItem value="As needed">As needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="startDate" className="text-right font-medium text-white">
                      Start Date
                    </label>
                    <div className="col-span-3">
                      <Input
                        id="startDate"
                        type="date"
                        className="border-green-500/30 focus:ring-green-500/30 bg-black text-white"
                        placeholder="dd-mm-yyyy"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="endDate" className="text-right font-medium text-white">
                      End Date
                    </label>
                    <div className="col-span-3">
                      <Input
                        id="endDate"
                        type="date"
                        className="border-green-500/30 focus:ring-green-500/30 bg-black text-white"
                        placeholder="dd-mm-yyyy"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="notes" className="text-right font-medium text-white">
                      Notes
                    </label>
                    <div className="col-span-3">
                      <Textarea
                        id="notes"
                        placeholder="Additional instructions or notes"
                        className="min-h-[80px] border-green-500/30 focus:ring-green-500/30 bg-black text-white placeholder:text-gray-500"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4 border-t border-green-500/20 pt-4 flex-shrink-0">
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedPatient}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Prescription"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prescription List</CardTitle>
              <CardDescription>
                View and manage all patient prescriptions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prescriptions..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={refreshPrescriptions}>
                <RefreshCw className={`h-4 w-4 ${loadingPrescriptions ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPrescriptions ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading prescriptions...</span>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex justify-center mb-2">
                <FileText className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="font-medium mb-1">No prescriptions found</h3>
              <p className="text-sm">Create a new prescription to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {prescription.patientName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{prescription.patientName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{prescription.medication}</TableCell>
                    <TableCell>{prescription.dosage}</TableCell>
                    <TableCell>{prescription.frequency}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs">From: {prescription.startDate}</span>
                        <span className="text-xs">To: {prescription.endDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={prescription.status === "Active" ? "default" : "secondary"}>
                        {prescription.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="icon">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle>AI Medication Recommendations</CardTitle>
            <CardDescription>
              Smart suggestions based on patient history and condition
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aiSuggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="flex justify-center mb-2">
                  <Sparkles className="h-10 w-10 opacity-20" />
                </div>
                <h3 className="font-medium mb-1">No AI suggestions available</h3>
                <p className="text-sm">AI medication suggestions will appear here when the feature is implemented</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-4 rounded-md border p-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-medium">{suggestion.medication} {suggestion.dosage}</h4>
                        <Badge variant="outline" className="ml-2">AI Suggested</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.frequency}
                      </p>
                      <p className="text-sm mt-2">
                        <span className="font-medium">Reason:</span> {suggestion.reason}
                      </p>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}