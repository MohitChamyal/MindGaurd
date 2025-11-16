import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Get timeframe from the request's search params
    const timeframe = request.nextUrl.searchParams.get('timeframe') || '4w';
    
    const backendUrl = `${apiUrl}/api/debug/analytics?timeframe=${timeframe}`;
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while fetching analytics data' },
      { status: 500 }
    );
  }
}