import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctorId = params.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (!doctorId) {
      return NextResponse.json(
        { status: 'error', message: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    console.log("Extra-details-patients/doctor/[id] route called with doctorId:", doctorId, status ? `and status: ${status}` : '');

    // Get auth token from request headers
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Format token properly with Bearer prefix if it doesn't have it
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const xAuthToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    try {
      // First try calling our backend API
      let apiEndpoint = `${apiUrl}/api/extra-details-patients/doctor/${doctorId}`;
      if (status) {
        apiEndpoint += `?status=${status}`;
      }

      console.log("Calling backend API endpoint:", apiEndpoint);
      
      // Make a direct request to the backend API with cache disabled
      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': authToken,
          'x-auth-token': xAuthToken,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        console.error("Backend API returned error status:", response.status);
        // Fall back to direct database query
        return await getDirectPatientData(doctorId, authToken);
      }

      const data = await response.json();
      console.log("Raw data from backend API:", data);
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log("No data returned from backend API, trying direct database query");
        return await getDirectPatientData(doctorId, authToken);
      }

      // Return the data
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error fetching from backend API:", error);
      console.log("Trying direct database query as fallback");
      return await getDirectPatientData(doctorId, authToken);
    }
  } catch (error) {
    console.error('Error in extra-details-patients/doctor/[id] API route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to directly query the database as a fallback
async function getDirectPatientData(doctorId: string, authToken: string) {
  try {
    // Try to get data directly from the database using a different endpoint
    const directApiEndpoint = `${apiUrl}/api/patient-details?doctorId=${doctorId}`;
    console.log("Trying direct database query via:", directApiEndpoint);
    
    const directResponse = await fetch(directApiEndpoint, {
      headers: {
        'Authorization': authToken
      },
      cache: 'no-store'
    });

    if (!directResponse.ok) {
      console.error("Direct database query failed:", directResponse.status);
      throw new Error('Failed to fetch patient data from all sources');
    }

    const directData = await directResponse.json();
    console.log("Data from direct database query:", directData);
    
    // Format data to match expected structure if needed
    let formattedData = directData;
    if (directData.data && Array.isArray(directData.data)) {
      formattedData = directData.data;
    } else if (directData.patients && Array.isArray(directData.patients)) {
      formattedData = directData.patients;
    }
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching from direct database query:", error);
    // Return empty array if all attempts fail
    return NextResponse.json([]);
  }
} 