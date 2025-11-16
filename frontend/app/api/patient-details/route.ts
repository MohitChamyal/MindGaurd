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

    // Fetch patient details from backend
    const response = await fetch(`${apiUrl}/api/patient-details/doctor/${doctorId}`, {
      headers: {
        'Authorization': token,
        'x-auth-token': token.startsWith('Bearer ') ? token.split(' ')[1] : token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { status: 'error', message: errorData.message || 'Failed to fetch patient details' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Received data from backend:", data);

    // Check if data contains patients array and return it
    if (data && data.patients) {
      return NextResponse.json({ 
        status: 'success', 
        data: data.patients
      });
    } else {
      console.error("Unexpected response format:", data);
      return NextResponse.json(
        { status: 'error', message: 'Unexpected response format from backend' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in patient-details API route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { status: 'error', message: 'Patient ID and status are required' },
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

    // Update patient status in backend
    const response = await fetch(`${apiUrl}/api/patient-details/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'x-auth-token': token.startsWith('Bearer ') ? token.split(' ')[1] : token
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { status: 'error', message: errorData.message || 'Failed to update patient status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ 
      status: 'success', 
      message: 'Patient status updated successfully',
      data: data.patient
    });
    
  } catch (error) {
    console.error('Error in patient-details API route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 