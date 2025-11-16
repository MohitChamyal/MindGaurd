import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/appointments - Frontend API route called');
    
    // Get the appointment data from request
    const data = await request.json();
    console.log('Appointment data received in frontend API:', data);
    
    // Get auth token
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
    
    // Ensure doctorName and doctorSpecialty are included in the data
    if (!data.doctorName || !data.doctorSpecialty) {
      console.warn('Doctor name or specialty missing in appointment data');
    }
    
    // Send the appointment data to the backend API
    const backendUrl = `${apiUrl}/api/appointments`;
    
    console.log('Creating appointment request with backend URL:', backendUrl);
    console.log('Request headers:', headers);
    console.log('Request body:', JSON.stringify(data));
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from backend:', errorData);
      throw new Error(errorData.msg || 'Failed to create appointment');
    }
    
    const responseData = await response.json();
    console.log('Successful response from backend:', responseData);
    
    return NextResponse.json({
      status: 'success',
      message: 'Appointment request created successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error creating appointment request:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'An error occurred while creating appointment request',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    
    if (!doctorId && !patientId) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Either doctorId or patientId is required'
        },
        { status: 400 }
      );
    }
    
    // Get auth token
    const token = request.headers.get('x-auth-token') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Authentication token is required'
        },
        { status: 401 }
      );
    }
    
    // Set up request headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Determine the endpoint based on the parameter
    let backendUrl: string;
    if (doctorId) {
      backendUrl = `${apiUrl}/api/appointments/doctor/${doctorId}`;
    } else {
      backendUrl = `${apiUrl}/api/appointments/patient/${patientId}`;
    }
    
    const response = await fetch(backendUrl, {
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to fetch appointments');
    }
    
    const responseData = await response.json();
    
    return NextResponse.json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'An error occurred while fetching appointments',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 