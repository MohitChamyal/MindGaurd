"use client";

import { useState, useEffect } from "react";
import { Users, Calendar, MessageSquare, Activity, ClipboardList } from "lucide-react";
import { RecentAppointments } from "./dashboard/recent-appointments";
import { StatCard } from "./dashboard/stat-card";
import { RecentMessages } from "./dashboard/recent-messages";
import { PatientConditionChart } from "./dashboard/patient-condition-chart";
import { PatientTrendChart } from "./dashboard/patient-trend-chart";
import { NewPatientSubmissions } from "./dashboard/new-patient-submissions";
import { apiUrl } from "@/lib/config";
import { toast } from "@/components/ui/use-toast";

interface DashboardData {
  stats: {
    totalPatients: number;
    appointmentsToday: number;
    unreadMessages: number;
    recoveryRate: number;
    patientTrend: number;
    appointmentTrend: number;
    messageTrend: number;
    recoveryTrend: number;
  };
  appointments: {
    id: string;
    patientName: string;
    patientImage?: string;
    date: string;
    time: string;
    status: "upcoming" | "completed" | "cancelled";
    type: "in-person" | "video";
  }[];
  messages: {
    id: string;
    senderName: string;
    senderImage?: string;
    content: string;
    time: string;
    isUnread: boolean;
  }[];
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalPatients: 0,
      appointmentsToday: 0,
      unreadMessages: 0,
      recoveryRate: 0,
      patientTrend: 0,
      appointmentTrend: 0,
      messageTrend: 0,
      recoveryTrend: 0
    },
    appointments: [],
    messages: []
  });
  const [doctorName, setDoctorName] = useState("Doctor");

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get doctor ID from multiple possible storage locations
        const doctorId = localStorage.getItem('doctor_id') || 
                        localStorage.getItem('mindguard_user_id') ||
                        localStorage.getItem('doctorId');
                        
        if (!doctorId) {
          throw new Error("Doctor ID not found. Please log in again.");
        }
        
        // Get auth token
        const token = localStorage.getItem('doctor_token') || 
                     localStorage.getItem('mindguard_token') || 
                     localStorage.getItem('token');
                     
        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }
        
        // Format token properly with Bearer prefix if it doesn't have it
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        console.log('Fetching dashboard data for doctorId:', doctorId);
        
        // Fetch approved patient registrations
        const registrationsResponse = await fetch(`${apiUrl}/api/patient-registrations/doctor-patients?status=approved&doctorId=${doctorId}`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (!registrationsResponse.ok) {
          throw new Error(`Failed to fetch patient registrations: ${registrationsResponse.status}`);
        }
        
        const registrationsData = await registrationsResponse.json();
        const approvedPatients = registrationsData.data?.registrations || [];
        console.log('Approved patients:', approvedPatients.length);
        
        // Fetch pending registrations for the badge count
        const pendingResponse = await fetch(`${apiUrl}/api/patient-registrations/doctor-patients?status=pending&doctorId=${doctorId}`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (!pendingResponse.ok) {
          throw new Error(`Failed to fetch pending registrations: ${pendingResponse.status}`);
        }
        
        const pendingData = await pendingResponse.json();
        const pendingPatients = pendingData.data?.registrations || [];
        console.log('Pending patients:', pendingPatients.length);
        
        // Try to fetch appointments if available
        let appointments = [];
        try {
          const appointmentsResponse = await fetch(`${apiUrl}/api/appointments/doctor/${doctorId}`, {
            headers: {
              'Authorization': authToken
            }
          });
          
          if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            appointments = appointmentsData.data || [];
          }
        } catch (error) {
          console.error('Error fetching appointments:', error);
          // Use fallback data based on approved patients
          appointments = approvedPatients.slice(0, 4).map((patient: any, index: number) => ({
            id: patient._id,
            patientName: patient.patientName,
            date: "Today",
            time: `${9 + (index * 2)}:00 ${index < 2 ? 'AM' : 'PM'}`,
            status: "upcoming",
            type: index % 2 === 0 ? "in-person" : "video"
          }));
        }
        
        // Create formatted dashboard data
        const formattedData: DashboardData = {
          stats: {
            totalPatients: approvedPatients.length,
            appointmentsToday: appointments.length,
            unreadMessages: pendingPatients.length,
            recoveryRate: Math.round(approvedPatients.length > 0 ? 78 : 0), // Placeholder recovery rate
            patientTrend: 12,
            appointmentTrend: 5,
            messageTrend: -3,
            recoveryTrend: 7
          },
          appointments: appointments.slice(0, 4).map((appointment: any) => ({
            id: appointment.id || appointment._id,
            patientName: appointment.patientName,
            date: appointment.date || "Today",
            time: appointment.time || "9:00 AM",
            status: appointment.status || "upcoming",
            type: appointment.type || "in-person"
          })),
          messages: pendingPatients.slice(0, 3).map((patient: any) => ({
            id: patient._id,
            senderName: patient.patientName,
            content: patient.symptoms || patient.medicalHistory || "New patient registration request",
            time: patient.createdAt || new Date().toISOString(),
            isUnread: true
          }))
        };
        
        setDashboardData(formattedData);
        
        // Get doctor name
        const storedDoctor = localStorage.getItem('doctor');
        const storedUsername = localStorage.getItem('username');
        
        if (storedDoctor) {
          try {
            const doctorData = JSON.parse(storedDoctor);
            if (doctorData && (doctorData.name || doctorData.fullName)) {
              // Use full name for the welcome message
              setDoctorName(doctorData.name || doctorData.fullName || "Doctor");
            } else if (storedUsername) {
              // Fall back to username if available
              setDoctorName(storedUsername);
            }
          } catch (err) {
            console.error('Error parsing doctor data:', err);
            if (storedUsername) {
              setDoctorName(storedUsername);
            }
          }
        } else if (storedUsername) {
          // Use username if doctor object isn't available
          setDoctorName(storedUsername);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Convert dashboard data to stats format for StatCard components
  const stats = [
    {
      title: "Total Patients",
      value: dashboardData.stats.totalPatients,
      icon: Users,
      trend: { value: dashboardData.stats.patientTrend, isPositive: dashboardData.stats.patientTrend > 0 },
    },
    {
      title: "Appointments Today",
      value: dashboardData.stats.appointmentsToday,
      icon: Calendar,
      trend: { value: dashboardData.stats.appointmentTrend, isPositive: dashboardData.stats.appointmentTrend > 0 },
    },
    {
      title: "Pending Registrations",
      value: dashboardData.stats.unreadMessages,
      icon: ClipboardList,
      trend: { value: Math.abs(dashboardData.stats.messageTrend), isPositive: dashboardData.stats.messageTrend > 0 },
    },
    {
      title: "Recovery Rate",
      value: `${dashboardData.stats.recoveryRate}%`,
      icon: Activity,
      trend: { value: dashboardData.stats.recoveryTrend, isPositive: dashboardData.stats.recoveryTrend > 0 },
    },
  ];

  // Sample condition data - this would ideally come from the API
  const conditionData = [
    { name: "Anxiety", value: 85, color: "hsl(var(--chart-1))" },
    { name: "Depression", value: 67, color: "hsl(var(--chart-2))" },
    { name: "PTSD", value: 42, color: "hsl(var(--chart-3))" },
    { name: "Bipolar", value: 28, color: "hsl(var(--chart-4))" },
    { name: "Other", value: 26, color: "hsl(var(--chart-5))" },
  ];

  // Sample trend data - this would ideally come from the API
  const trendData = [
    { name: "Jan", newPatients: 20, recoveredPatients: 10 },
    { name: "Feb", newPatients: 25, recoveredPatients: 15 },
    { name: "Mar", newPatients: 30, recoveredPatients: 20 },
    { name: "Apr", newPatients: 28, recoveredPatients: 22 },
    { name: "May", newPatients: 35, recoveredPatients: 25 },
    { name: "Jun", newPatients: 40, recoveredPatients: 30 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {doctorName.includes("Dr.") ? doctorName : `Dr. ${doctorName}`}. Here's an overview of your practice.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>
      
      {/* New Patient Submissions section */}
      <div className="grid gap-4 md:grid-cols-1">
        <NewPatientSubmissions />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RecentAppointments appointments={dashboardData.appointments} />
        <RecentMessages messages={dashboardData.messages} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PatientConditionChart data={conditionData} />
        <PatientTrendChart data={trendData} />
      </div>
    </div>
  );
}