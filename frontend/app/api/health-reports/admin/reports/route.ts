import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Get timeframe from query params
    const timeframe = request.nextUrl.searchParams.get('timeframe') || '4w';
    
    // Get authentication token
    const token = request.headers.get('x-auth-token') || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    console.log(`[Admin Reports API] Processing request for timeframe: ${timeframe}`);
    console.log(`[Admin Reports API] Token present: ${!!token}`);
    
    if (!token) {
      console.log('[Admin Reports API] No authentication token provided');
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    // Call backend API
    const backendUrl = `${apiUrl}/api/health-reports/admin/reports?timeframe=${timeframe}`;
    
    console.log(`[Admin Reports API] Forwarding request to backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      cache: 'no-store'
    });
    
    console.log(`[Admin Reports API] Backend response status: ${response.status}`);
    
    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      
      console.error('[Admin Reports API] Backend error:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to fetch health reports from backend' },
        { status: response.status }
      );
    }
    
    const reports = await response.json();
    console.log('[Admin Reports API] Successfully retrieved reports data');
    return NextResponse.json(reports);
  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 