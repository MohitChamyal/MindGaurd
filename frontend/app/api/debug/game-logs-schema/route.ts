import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Get authentication token
    const token = request.headers.get('x-auth-token') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
    
    // Set up request headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['x-auth-token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Make request to backend
    const backendUrl = `${apiUrl}/api/debug/game-logs-schema`;
    console.log(`[Debug Schema API] Calling ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return NextResponse.json({
        status: 'error',
        message: `Failed to fetch schema data: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Debug Schema API] Error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'An error occurred while checking game logs schema',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 