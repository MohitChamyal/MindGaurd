import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const token = request.headers.get('x-auth-token');

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Missing userId or token' },
        { status: 400 }
      );
    }

    // Call backend API
    const backendUrl = `${apiUrl}/api/game-logs/${userId}/stats`;
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to fetch game statistics' },
        { status: response.status }
      );
    }
    
    const stats = await response.json();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 