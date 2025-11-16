import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '../../../utils/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    // Verify auth token
    const verifiedToken = verifyAuthToken(authHeader);
    if (!verifiedToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const doctorId = url.searchParams.get('doctorId');
    const patientId = url.searchParams.get('patientId');

    if (!doctorId || !patientId) {
      return NextResponse.json({ error: 'Doctor ID and Patient ID are required' }, { status: 400 });
    }

    console.log(`Checking if patient ${patientId} exists for doctor ${doctorId}`);

    // Build API URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const apiUrl = `${baseUrl}/api/doctors/${doctorId}/patients/${patientId}/exists`;

    console.log(`Querying API at: ${apiUrl}`);

    // Call the backend API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error checking patient exists:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to check if patient exists' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in patient-exists API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' }, 
      { status: 500 }
    );
  }
} 