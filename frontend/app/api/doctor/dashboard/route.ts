import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Get doctor ID from query params
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json(
        { status: 'error', message: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Format token properly
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const xAuthToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    // Fetch combined data from backend
    const response = await fetch(`${apiUrl}/api/consultations/doctor/${doctorId}`, {
      headers: {
        'Authorization': authToken,
        'x-auth-token': xAuthToken
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { status: 'error', message: errorData.message || 'Failed to fetch doctor dashboard data' },
        { status: response.status }
      );
    }

    // Process the data
    const data = await response.json();
    console.log("Received combined data from backend:", data);

    if (data.success && data.data) {
      const { appointments, patients } = data.data;
      
      // Return the combined data
      return NextResponse.json({
        status: 'success',
        data: {
          appointments,
          patients
        }
      });
    } else {
      console.error("Unexpected response format:", data);
      return NextResponse.json(
        { status: 'error', message: 'Unexpected response format from backend' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in doctor dashboard API route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 