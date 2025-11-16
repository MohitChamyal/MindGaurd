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
    
    // Call backend API
    const backendUrl = `${apiUrl}/api/consultations/upcoming/${userId}`;
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      // Return empty appointments array if endpoint doesn't exist
      // This prevents errors in the UI
      return NextResponse.json({ appointments: [] });
    }
    
    const appointmentsData = await response.json();
    return NextResponse.json(appointmentsData);
  } catch (error) {
    console.error('API route error:', error);
    // Return empty appointments array on error
    return NextResponse.json({ appointments: [] });
  }
} 