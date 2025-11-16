'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from "@/components/patient/dashboard-overview";
import { UpcomingAppointments } from "@/components/patient/upcoming-appointments";
import { MoodTracker } from "@/components/patient/mood-tracker";
import { WellnessScore } from "@/components/patient/wellness-score";
import { RecommendedActivities } from "@/components/patient/recommended-activities";
import { CommunityHighlights } from "@/components/patient/community-highlights";
import { apiUrl } from '@/lib/config';

interface UserData {
  username: string;
  email: string;
}

export default function PatientDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('mindguard_user_id');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    
    if (!token || !userId) {
      router.push('/login');
      return;
    }

    setUserData({
      username: username || '',
      email: email || ''
    });
  }, [router]);

  // Check if user has completed an assessment
  useEffect(() => {
    const checkAssessmentStatus = async () => {
      const userId = localStorage.getItem('mindguard_user_id');
      if (!userId) return;

      try {
        const response = await fetch(`${apiUrl}/api/health-tracking/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setHasCompletedAssessment(data.healthreports && data.healthreports.length > 0);
        }
      } catch (error) {
        console.error('Error checking assessment status:', error);
      }
    };

    checkAssessmentStatus();
  }, []);

  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    localStorage.removeItem('token');
    localStorage.removeItem('mindguard_token');
    localStorage.removeItem('mindguard_user_id');
    localStorage.removeItem('mindguard_user_type');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    
    // Clear token cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Redirect to landing page
    router.push('/');
  };

  if (!userData) return null;

  return (
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardOverview onAssessmentStatusChange={setHasCompletedAssessment} />
        
        {hasCompletedAssessment && (
          <div className="grid grid-cols-1 gap-6 mt-5 md:grid-cols-2 lg:grid-cols-3">
            <WellnessScore />
            <MoodTracker />
            <UpcomingAppointments />
          </div>
        )}
      </div>
    </div>
  );
}