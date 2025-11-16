import { NextRequest, NextResponse } from 'next/server';

// Environment variables or constants
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * API handler for extra details patients
 */
export async function POST(request: NextRequest) {
  try {
    // Forward request to backend
    const requestData = await request.json();
    
    // Extract auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    // Log the request for debugging
    console.log('[API Route] POST /api/extra-details-patients', { 
      patientName: requestData.patientName,
      patientEmail: requestData.patientEmail 
    });
    
    console.log('[API Route] Forwarding request to backend:', `${API_URL}/api/extra-details-patients`);
    
    // Make the request to the backend
    const response = await fetch(`${API_URL}/api/extra-details-patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      },
      body: JSON.stringify(requestData)
    });
    
    // Parse response from backend
    const data = await response.json();
    
    // If response is not ok, throw error
    if (!response.ok) {
      console.error('[API Route] Error from backend:', data);
      throw new Error(data.message || data.msg || 'Error saving patient details');
    }
    
    // Return successful response
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Route] Error in extra-details-patients API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to save patient details'
      },
      { status: 500 }
    );
  }
}

/**
 * API handler for getting all patients
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    // Extract auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization required' },
        { status: 401 }
      );
    }
    
    // Construct the API URL with query parameters
    let apiUrl = `${API_URL}/api/extra-details-patients`;
    if (status) {
      apiUrl += `?status=${status}`;
    }
    
    // Make the request to the backend
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });
    
    // Parse response from backend
    const data = await response.json();
    
    // If response is not ok, throw error
    if (!response.ok) {
      throw new Error(data.message || data.msg || 'Error fetching patients');
    }
    
    // Return successful response
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Route] Error in extra-details-patients GET API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch patients'
      },
      { status: 500 }
    );
  }
} 