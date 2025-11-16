import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Fetching health data for user:', userId);
    
    // Call backend API
    const backendUrl = `${apiUrl}/api/health-tracking/${userId}`;
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.warn(`Health tracking API returned status ${response.status}`);
      
      if (response.status === 404) {
        // Return empty data structure for new users
        return NextResponse.json({
          healthreports: [],
          insights: {
            mainInsight: {},
            riskAnalysis: { low: 0, moderate: 0, high: 0 },
            anxietyTrend: { status: 'stable', percentage: 0, detail: 'No trend data available yet' },
            stressResponse: { status: 'stable', percentage: 0, detail: 'No stress data available yet' },
            moodStability: { status: 'stable', detail: 'No mood data available yet' }
          }
        });
      }
      
      // Log the actual error
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      // Return a generic error response
      return NextResponse.json(
        { error: 'Failed to fetch health data' },
        { status: response.status }
      );
    }
    
    const healthData = await response.json();
    return NextResponse.json(healthData);
  } catch (error) {
    console.error('API route error:', error);
    
    // Return empty data structure as fallback
    return NextResponse.json({
      healthreports: [],
      insights: {
        mainInsight: {},
        riskAnalysis: { low: 0, moderate: 0, high: 0 },
        anxietyTrend: { status: 'stable', percentage: 0, detail: 'No trend data available yet' },
        stressResponse: { status: 'stable', percentage: 0, detail: 'No stress data available yet' },
        moodStability: { status: 'stable', detail: 'No mood data available yet' }
      }
    });
  }
} 