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
    const backendUrl = `${apiUrl}/api/memories/${userId}`;
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      // If it's a 404, just return empty memories
      if (response.status === 404) {
        return NextResponse.json([]);
      }
      
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to fetch memories' },
        { status: response.status }
      );
    }
    
    const memories = await response.json();
    return NextResponse.json(memories);
  } catch (error) {
    console.error('API route error:', error);
    
    // Return empty array as a fallback
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-auth-token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if (!body.userId) {
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 }
      );
    }
    
    // Call backend API
    const backendUrl = `${apiUrl}/api/memories`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to save memory' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 