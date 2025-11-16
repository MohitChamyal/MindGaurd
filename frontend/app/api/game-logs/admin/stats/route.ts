import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Get timeframe from query params
    const timeframe = request.nextUrl.searchParams.get('timeframe') || '4w';
    
    // Get authentication token
    const token = request.headers.get('x-auth-token') || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    console.log(`[Admin Stats API] Processing request for timeframe: ${timeframe}`);
    console.log(`[Admin Stats API] Token present: ${!!token}`);
    
    if (!token) {
      console.log('[Admin Stats API] No authentication token provided');
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    // Call backend API
    const backendUrl = `${apiUrl}/api/game-logs/admin/stats?timeframe=${timeframe}`;
    
    console.log(`[Admin Stats API] Forwarding request to backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      cache: 'no-store'
    });
    
    console.log(`[Admin Stats API] Backend response status: ${response.status}`);
    
    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      
      console.error('[Admin Stats API] Backend error:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to fetch game statistics from backend' },
        { status: response.status }
      );
    }
    
    const stats = await response.json();
    console.log('[Admin Stats API] Successfully retrieved stats data');
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Admin Stats API] Unhandled error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}