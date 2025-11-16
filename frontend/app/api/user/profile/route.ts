import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Get token from headers or cookies
    const authHeader = request.headers.get('x-auth-token');
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!authHeader && !userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Call backend API to get user profile
    const backendUrl = `${apiUrl}/api/user/profile${userId ? `?userId=${userId}` : ''}`;
    
    // Add token to request headers if available
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (authHeader) {
      headers['x-auth-token'] = authHeader;
    }
    
    console.log('Making backend request to:', backendUrl);
    console.log('With headers:', JSON.stringify(headers));
    
    // Make the request to the backend
    const response = await fetch(backendUrl, {
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error status:', response.status);
      console.error('Backend error text:', errorText);
      
      // Try to parse the error text as JSON
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorJson.error || errorJson.msg || 'Failed to fetch user profile' },
          { status: response.status }
        );
      } catch (e) {
        // If not JSON, return the raw error text
        return NextResponse.json(
          { error: 'Failed to fetch user profile', details: errorText },
          { status: response.status }
        );
      }
    }
    
    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while processing your request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 