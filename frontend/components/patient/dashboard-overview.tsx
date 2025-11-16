"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MessageSquare, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardOverviewProps {
  onAssessmentStatusChange?: (hasCompleted: boolean) => void;
}

export function DashboardOverview({ onAssessmentStatusChange }: DashboardOverviewProps) {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  
  // Log username changes for debugging
  useEffect(() => {
    console.log('Username state updated:', username);
  }, [username]);
  
  const [healthData, setHealthData] = useState({
    healthreports: {
      mood: 0,
      anxiety: 0,
      sleep_quality: 0,
      energy_levels: 0,
      concentration: 0,
      social_interactions: 0,
      optimism: 0
    },
    insights: {
      mainInsight: {},
      riskAnalysis: {
        low: 0,
        moderate: 0,
        high: 0
      },
      anxietyTrend: {
        status: '',
        percentage: 0,
        detail: ''
      },
      stressResponse: {
        status: '',
        percentage: 0,
        detail: ''
      },
      moodStability: {
        status: '',
        detail: ''
      }
    }
  });

  // Debug health data changes
  useEffect(() => {
    console.log('Current health data:', healthData);
  }, [healthData]);

  // Update the completed assessment state and notify parent
  const updateAssessmentStatus = (status: boolean) => {
    setHasCompletedAssessment(status);
    if (onAssessmentStatusChange) {
      onAssessmentStatusChange(status);
    }
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to get username from localStorage
        const userId = localStorage.getItem('mindguard_user_id');
        const storedUsername = localStorage.getItem('username');
        const token = localStorage.getItem('token');
        
        // Debug localStorage values
        console.log('localStorage values:', {
          userId,
          username: storedUsername,
          token
        });
        
        if (storedUsername && storedUsername !== 'undefined') {
          setUsername(storedUsername);
          // Still make the API call in background to keep data fresh
          fetchUserFromAPI(userId);
          return;
        }
        
        // If no stored username, fetch from API
        if (userId) {
          await fetchUserFromAPI(userId);
        } else {
          setUsername('Guest');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUsername('Guest');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchUserFromAPI = async (userId: string | null) => {
      if (!userId) {
        setUsername('Guest');
        return;
      }

      try {
        // Try to get username directly from token payload
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            if (payload.username) {
              setUsername(payload.username);
              localStorage.setItem('username', payload.username);
              // Skip API call since we already have the username
              return;
            }
          } catch (e) {
            console.error('Error parsing token:', e);
          }
        }

        // Check if we already have a valid stored username for this user
        const storedUsername = localStorage.getItem('username');
        if (storedUsername && storedUsername !== 'undefined' && storedUsername !== 'Guest') {
          setUsername(storedUsername);
          // Skip the API call if we already have the username
          return;
        }

        // Only make API call if we couldn't get username from token or localStorage
        console.log('Fetching user profile from API...');
        const response = await fetch(`/api/user/profile?userId=${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token || ''
          }
        });

        if (!response.ok) {
          let errorMessage = 'Failed to fetch user data';
          try {
            const errorData = await response.json();
            console.error('Failed to fetch user data:', errorData);
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
          // Don't throw error here - we'll just use the fallback
          console.warn('Using fallback username - API request failed');
          // Use userId as fallback if we have nothing better
          setUsername(userId);
          return;
        }

        const data = await response.json();
        console.log('User data from API:', data);
        
        if (data && data.name) {
          setUsername(data.name);
          localStorage.setItem('username', data.name);
        } else if (data && data.username) {
          setUsername(data.username);
          localStorage.setItem('username', data.username);
        } else {
          // Try to get from mindguard_user object if it exists
          const userDataString = localStorage.getItem('mindguard_user');
          if (userDataString) {
            try {
              const userData = JSON.parse(userDataString);
              if (userData.username) {
                setUsername(userData.username);
                localStorage.setItem('username', userData.username);
                return;
              }
            } catch (e) {
              console.error('Error parsing user data:', e);
            }
          }
          
          // Fall back to user ID if nothing else works
          setUsername(userId);
        }
      } catch (error) {
        console.error('API error:', error);
        // Try to use existing data from localStorage if API fails
        const storedUsername = localStorage.getItem('username');
        if (storedUsername && storedUsername !== 'Guest' && storedUsername !== 'undefined') {
          setUsername(storedUsername);
        } else {
          setUsername(userId || 'Guest');
        }
      }
    };

    fetchUserData();
  }, []);

  // Fetch health data
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const userId = localStorage.getItem('mindguard_user_id');
        if (!userId) {
          updateAssessmentStatus(false);
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/health-tracking/${userId}`);
        if (!response.ok) {
          if (response.status === 404) {
            updateAssessmentStatus(false);
            setIsLoading(false);
            router.push('/patient/health-tracking?firstTime=true');
            return;
          }
          throw new Error('Failed to fetch health data');
        }

        const data = await response.json();
        console.log('Received health data:', data);
        
        if (data && data.healthreports) {
          // Check if healthreports is an array or already transformed
          let transformedData;
          
          if (Array.isArray(data.healthreports) && data.healthreports.length > 0) {
            // Transform the array data to match the expected format
            transformedData = {
              healthreports: {
                mood: data.healthreports[0]?.mood * 10 || 0,
                anxiety: data.healthreports[0]?.anxiety || 0,
                sleep_quality: data.healthreports[0]?.sleep_quality * 10 || 0,
                energy_levels: data.healthreports[0]?.energy_levels * 10 || 0,
                concentration: data.healthreports[0]?.concentration * 10 || 0,
                social_interactions: data.healthreports[0]?.social_interactions * 10 || 0,
                optimism: data.healthreports[0]?.optimism * 10 || 0
              },
              insights: data.insights || {
                mainInsight: {},
                riskAnalysis: {
                  low: 0,
                  moderate: 0,
                  high: 0
                },
                anxietyTrend: {
                  status: 'stable',
                  percentage: 0,
                  detail: 'No trend data available yet'
                },
                stressResponse: {
                  status: 'stable',
                  percentage: 0,
                  detail: 'No stress data available yet'
                },
                moodStability: {
                  status: 'stable',
                  detail: 'No mood data available yet'
                }
              }
            };
          } else if (typeof data.healthreports === 'object') {
            // Data is already in the expected format or needs minimal transformation
            transformedData = {
              healthreports: data.healthreports,
              insights: data.insights || {
                mainInsight: {},
                riskAnalysis: { low: 0, moderate: 0, high: 0 },
                anxietyTrend: { status: 'stable', percentage: 0, detail: 'No trend data available yet' },
                stressResponse: { status: 'stable', percentage: 0, detail: 'No stress data available yet' },
                moodStability: { status: 'stable', detail: 'No mood data available yet' }
              }
            };
          } else {
            // Empty or invalid data
            transformedData = {
              healthreports: {
                mood: 0,
                anxiety: 0,
                sleep_quality: 0,
                energy_levels: 0,
                concentration: 0,
                social_interactions: 0,
                optimism: 0
              },
              insights: {
                mainInsight: {},
                riskAnalysis: { low: 0, moderate: 0, high: 0 },
                anxietyTrend: { status: 'stable', percentage: 0, detail: 'No trend data available yet' },
                stressResponse: { status: 'stable', percentage: 0, detail: 'No stress data available yet' },
                moodStability: { status: 'stable', detail: 'No mood data available yet' }
              }
            };
          }
          
          setHealthData(transformedData);
          updateAssessmentStatus(true);
        } else {
          updateAssessmentStatus(false);
        }
      } catch (error) {
        console.error('Error loading health data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load health data');
        updateAssessmentStatus(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
  }, [router, onAssessmentStatusChange]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading health data...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!hasCompletedAssessment) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">{username}</h1>
            <p className="text-muted-foreground">
              Welcome to MindGuard! Let's start your wellness journey
            </p>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Complete Your Assessment</CardTitle>
            <CardDescription>
              Complete a brief assessment to get personalized insights and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-center text-muted-foreground mb-6">
              Your personalized dashboard will appear here after you complete your first health assessment.
              This helps us understand your needs and provide relevant recommendations.
            </p>
            <Button size="lg" onClick={() => router.push('/patient/health-tracking?firstTime=true')}>
              <Sparkles className="mr-2 h-4 w-4" />
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submitQuestionnaireData = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch('http://localhost:3000/api/questionnaire/update', {
        method: 'PUT',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update questionnaire data');
      }

      const updatedData = await response.json();
      setHealthData({
        healthreports: {
          mood: updatedData.mood/10 * 100 || 0,
          anxiety: updatedData.anxiety/10 * 100 || 0,
          sleep_quality: updatedData.sleep_quality/10 * 100 || 0,
          energy_levels: updatedData.energy_levels/10 * 100 || 0,
          concentration: updatedData.concentration/10 * 100 || 0,
          social_interactions: updatedData.social_interactions/10 * 100 || 0,
          optimism: updatedData.optimism/10 * 100 || 0
        },
        insights: healthData.insights
      });
    } catch (error) {
      console.error('Error updating questionnaire data:', error);
    }
  };

  const handleDailyCheckIn = () => {
    const newData = {
      mood: 75,
      anxiety: 30,
      sleep_quality: 80,
      energy_levels: 65,
      concentration: 70,
      social_interactions: 60,
      optimism: 85
    };
    submitQuestionnaireData(newData);
  };

  const handleTestSubmit = async () => {
    const testData = {
      healthreports: {
        mood: 75,
        anxiety: 60,
        sleep_quality: 80,
        energy_levels: 70,
        concentration: 65,
        social_interactions: 55,
        optimism: 85
      }
    };

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3000/api/questionnaire/update', {
        method: 'PUT',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      if (!response.ok) throw new Error('Failed to submit test data');

      const updatedData = await response.json();
      setHealthData({
        healthreports: {
          mood: updatedData.mood/10 * 100 || 0,
          anxiety: updatedData.anxiety/10 * 100 || 0,
          sleep_quality: updatedData.sleep_quality/10 * 100 || 0,
          energy_levels: updatedData.energy_levels/10 * 100 || 0,
          concentration: updatedData.concentration/10 * 100 || 0,
          social_interactions: updatedData.social_interactions/10 * 100 || 0,
          optimism: updatedData.optimism/10 * 100 || 0
        },
        insights: healthData.insights
      });
    } catch (error) {
      console.error('Error submitting test data:', error);
    }
  };

  const submitTestData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch('http://localhost:3000/api/questionnaire/submit', {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to submit test data');
      }

      const data = await response.json();
      console.log('Submitted test data:', data);
      
      setHealthData({
        healthreports: data.healthreports,
        insights: data.insights
      });
    } catch (error) {
      console.error('Error submitting test data:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">{username}</h1>
          <p className="text-muted-foreground">
            Here's an overview of your mental health journey
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          <Button variant="outline" className="gap-2 w-full sm:w-auto" asChild>
            <Link href="/patient/consultations">
              <CalendarDays className="h-4 w-4" />
              Book Consultation
            </Link>
          </Button>
          <Button className="gap-2 w-full sm:w-auto" asChild>
            <Link href="/patient/health-tracking">
              <Sparkles className="h-4 w-4" />
              Daily Check-in
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Your Wellness Journey</CardTitle>
          <CardDescription>
            {healthData.healthreports.mood > 0 
              ? "Your assessment progress across sessions" 
              : "Complete an assessment to see your progress"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { 
                name: "Mood Stability", 
                value: healthData.healthreports.mood, 
                color: "#4f46e5",
                gradient: "from-indigo-500 to-indigo-600",
                trend: healthData.healthreports.mood > 70 ? "up" : "down"
              },
              { 
                name: "Anxiety Level", 
                value: healthData.healthreports.anxiety, 
                color: "#ef4444",
                gradient: "from-red-500 to-red-600",
                trend: healthData.healthreports.anxiety < 30 ? "up" : "down"
              },
              { 
                name: "Sleep Quality", 
                value: healthData.healthreports.sleep_quality, 
                color: "#0ea5e9",
                gradient: "from-sky-500 to-sky-600",
                trend: healthData.healthreports.sleep_quality > 70 ? "up" : "down"
              },
              { 
                name: "Energy Level", 
                value: healthData.healthreports.energy_levels, 
                color: "#f59e0b",
                gradient: "from-amber-500 to-amber-600",
                trend: healthData.healthreports.energy_levels > 70 ? "up" : "down"
              },
              { 
                name: "Concentration", 
                value: healthData.healthreports.concentration, 
                color: "#10b981",
                gradient: "from-emerald-500 to-emerald-600",
                trend: healthData.healthreports.concentration > 70 ? "up" : "down"
              },
              { 
                name: "Social Interaction", 
                value: healthData.healthreports.social_interactions, 
                color: "#8b5cf6",
                gradient: "from-violet-500 to-violet-600",
                trend: healthData.healthreports.social_interactions > 70 ? "up" : "down"
              },
              { 
                name: "Optimism", 
                value: healthData.healthreports.optimism, 
                color: "#ec4899",
                gradient: "from-pink-500 to-pink-600",
                trend: healthData.healthreports.optimism > 70 ? "up" : "down"
              }
            ].map((metric, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 mb-2 md:mb-3">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold">{Math.round(metric.value)}%</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: metric.name, value: metric.value },
                          { name: "Remaining", value: 100 - metric.value }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={35}
                        paddingAngle={2}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill={metric.color} />
                        <Cell fill="#f3f4f6" />
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, metric.name]}
                        contentStyle={{ 
                          backgroundColor: "white", 
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium">{metric.name}</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5 md:mt-1">
                    {metric.trend === "up" ? (
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500" />
                    )}
                    <span className={`text-[10px] sm:text-xs ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      {metric.trend === "up" ? "Improving" : "Needs attention"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}