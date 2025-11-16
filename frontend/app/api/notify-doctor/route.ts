import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '../../../utils/auth-utils';

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { doctorId, patientId, patientName } = body;

    if (!doctorId || !patientId || !patientName) {
      return NextResponse.json(
        { error: 'Doctor ID, Patient ID, and Patient Name are required' }, 
        { status: 400 }
      );
    }

    console.log(`Notifying doctor ${doctorId} about patient ${patientName} (${patientId})`);

    // Build API URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const apiUrl = `${baseUrl}/api/notifications`;

    // Call the backend API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        recipientId: doctorId,
        type: 'PATIENT_PROFILE_SUBMITTED',
        message: `Patient ${patientName} has submitted their profile information.`,
        metadata: {
          patientId,
          patientName
        },
        read: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error notifying doctor:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to notify doctor' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      message: 'Doctor notification sent successfully',
      data 
    });
  } catch (error) {
    console.error('Error in notify-doctor API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' }, 
      { status: 500 }
    );
  }
} 