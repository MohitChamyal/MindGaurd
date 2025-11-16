'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { apiUrl } from '@/lib/config';
import { format, subWeeks, eachWeekOfInterval } from 'date-fns';

// Mock data as fallback
const mockData = [
  {
    name: 'Jan',
    users: 2400,
    therapists: 240,
    interactions: 24000,
  },
  {
    name: 'Feb',
    users: 3000,
    therapists: 270,
    interactions: 28000,
  },
  {
    name: 'Mar',
    users: 4500,
    therapists: 290,
    interactions: 35000,
  },
  {
    name: 'Apr',
    users: 5200,
    therapists: 305,
    interactions: 40000,
  },
  {
    name: 'May',
    users: 6800,
    therapists: 310,
    interactions: 48000,
  },
  {
    name: 'Jun',
    users: 8200,
    therapists: 315,
    interactions: 56000,
  },
  {
    name: 'Jul',
    users: 9600,
    therapists: 320,
    interactions: 65000,
  },
  {
    name: 'Aug',
    users: 10800,
    therapists: 322,
    interactions: 72000,
  },
  {
    name: 'Sep',
    users: 11500,
    therapists: 324,
    interactions: 78000,
  },
];

export function Overview() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchRecentUserActivity();
  }, []);

  const fetchRecentUserActivity = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || 
                    localStorage.getItem('mindguard_token') ||
                    sessionStorage.getItem('token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }

      // Fetch both users and doctors data
      const [usersResponse, doctorsResponse] = await Promise.all([
        fetch(`${apiUrl}/api/test/users`, { headers }),
        fetch(`${apiUrl}/api/test/doctors`, { headers })
      ]);

      if (!usersResponse.ok || !doctorsResponse.ok) {
        throw new Error('Failed to fetch user activity data');
      }

      const users = await usersResponse.json();
      const doctors = await doctorsResponse.json();

      // Create an array of the last 6 weeks
      const today = new Date();
      const sixWeeksAgo = subWeeks(today, 5); // 5 because we want current week + 5 previous weeks
      
      // Get weekly intervals
      const weekIntervals = eachWeekOfInterval({
        start: sixWeeksAgo,
        end: today
      });

      // Process the data into weekly format
      const processedData = weekIntervals.map((weekStart, index) => {
        const weekEnd = index < weekIntervals.length - 1 
          ? weekIntervals[index + 1] 
          : today;

        // Format week label as "MMM d" (e.g., "Apr 15")
        const weekLabel = format(weekStart, 'MMM d');

        // Filter users and doctors registered in this week
        const weekUsers = users.filter((user: any) => {
          const regDate = new Date(user.createdAt?.$date || user.createdAt);
          return regDate >= weekStart && regDate < weekEnd;
        });

        const weekDoctors = doctors.filter((doctor: any) => {
          const regDate = new Date(doctor.createdAt?.$date || doctor.createdAt);
          return regDate >= weekStart && regDate < weekEnd;
        });

        // Calculate interactions based on bookings in this week
        const interactions = weekUsers.reduce((acc: number, user: any) => {
          const weekBookings = (user.bookings || []).filter((booking: any) => {
            const bookingDate = new Date(booking.date?.$date || booking.date);
            return bookingDate >= weekStart && bookingDate < weekEnd;
          });
          return acc + weekBookings.length;
        }, 0);

        return {
          name: weekLabel,
          users: weekUsers.length,
          therapists: weekDoctors.length,
          interactions: interactions
        };
      });

      setUserData(processedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching user activity:', err);
      setError('Failed to load user activity data');
      setUserData(mockData); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="animate-pulse text-muted-foreground">Loading user activity data...</div>
      </div>
    );
  }

  if (error) {
    console.error('Error in user activity data:', error);
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={userData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Bar
          dataKey="users"
          fill="hsl(var(--chart-1))"
          radius={[4, 4, 0, 0]}
          name="New Users"
        />
        <Bar
          dataKey="therapists"
          fill="hsl(var(--chart-2))"
          radius={[4, 4, 0, 0]}
          name="New Therapists"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}