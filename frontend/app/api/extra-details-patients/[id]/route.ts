import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get patient ID from URL params
    const patientId = params.id;
    
    if (!patientId) {
      return NextResponse.json(
        { status: 'error', message: 'Patient ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching details for patient ID: ${patientId}`);
    
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
    
    console.log(`Making request to backend API: ${apiUrl}/api/extra-details-patients/${patientId}`);
    
    // Fetch patient details from backend
    const response = await fetch(`${apiUrl}/api/extra-details-patients/${patientId}`, {
      headers: {
        'Authorization': authToken,
        'x-auth-token': xAuthToken
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error fetching patient details: ${response.status}`, errorData);
      return NextResponse.json(
        { status: 'error', message: errorData.message || 'Failed to fetch patient details' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log("Patient details from backend:", data);
    
    // Check the response structure and handle both formats
    let patientDetails;
    
    if (data.patient) {
      patientDetails = data.patient;
      console.log("Using patient field from response");
    } else if (data.patientDetails) {
      patientDetails = data.patientDetails;
      console.log("Using patientDetails field from response");
    } else {
      patientDetails = data;
      console.log("Using direct data from response");
    }
    
    // Ensure all fields are present with defaults
    const formattedPatientDetails = {
      _id: patientDetails._id,
      doctorId: patientDetails.doctorId || '',
      patientName: patientDetails.patientName || '',
      patientEmail: patientDetails.patientEmail || '',
      patientAge: patientDetails.patientAge || '',
      patientGender: patientDetails.patientGender || '',
      medicalHistory: patientDetails.medicalHistory || '',
      currentMedications: Array.isArray(patientDetails.currentMedications) ? patientDetails.currentMedications : [],
      allergies: Array.isArray(patientDetails.allergies) ? patientDetails.allergies : [],
      symptoms: patientDetails.symptoms || '',
      notes: patientDetails.notes || '',
      mentalHealthConcern: patientDetails.mentalHealthConcern || '',
      status: patientDetails.status || 'pending',
      createdAt: patientDetails.createdAt || new Date().toISOString(),
      updatedAt: patientDetails.updatedAt || new Date().toISOString()
    };
    
    // Log the final patient details object
    console.log("Formatted patient details:", {
      _id: formattedPatientDetails._id,
      patientName: formattedPatientDetails.patientName,
      medicalHistory: !!formattedPatientDetails.medicalHistory,
      medications: formattedPatientDetails.currentMedications.length,
      allergies: formattedPatientDetails.allergies.length,
      symptoms: !!formattedPatientDetails.symptoms,
      notes: !!formattedPatientDetails.notes,
      mentalHealthConcern: !!formattedPatientDetails.mentalHealthConcern
    });
    
    // Return the data
    return NextResponse.json({
      status: 'success',
      data: formattedPatientDetails
    });
    
  } catch (error) {
    console.error('Error in extra-details-patients/[id] API route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get patient ID from URL params
    const patientId = params.id;
    
    if (!patientId) {
      return NextResponse.json(
        { status: 'error', message: 'Patient ID is required' },
        { status: 400 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
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
    
    // Update patient details in backend
    const response = await fetch(`${apiUrl}/api/extra-details-patients/${patientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'x-auth-token': xAuthToken
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { status: 'error', message: errorData.message || 'Failed to update patient details' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return success response
    return NextResponse.json({
      status: 'success',
      message: 'Patient details updated successfully',
      data: data.patientDetails
    });
    
  } catch (error) {
    console.error('Error in extra-details-patients/[id] PUT route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get patient ID from URL params
    const patientId = params.id;
    
    if (!patientId) {
      return NextResponse.json(
        { status: 'error', message: 'Patient ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Attempting to delete patient ID: ${patientId}`);
    
    // Get auth token from request headers
    const token = request.headers.get('authorization');
    if (!token) {
      console.log('No authorization token found in request headers');
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Format token properly with Bearer prefix if it doesn't have it
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const xAuthToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    
    console.log(`Making delete request to backend: ${apiUrl}/api/extra-details-patients/${patientId}`);
    console.log(`Auth token begins with: ${authToken.substring(0, 15)}...`);
    
    // Delete patient from backend
    const response = await fetch(`${apiUrl}/api/extra-details-patients/${patientId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authToken,
        'x-auth-token': xAuthToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to delete patient';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error(`Error from backend: ${response.status}`, errorData);
      } catch (e: unknown) {
        console.error(`Error parsing error response: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      return NextResponse.json(
        { status: 'error', message: errorMessage },
        { status: response.status }
      );
    }
    
    console.log(`Successfully deleted patient ID: ${patientId}`);
    
    // Return success response
    return NextResponse.json({
      status: 'success',
      message: 'Patient deleted successfully'
    });
    
  } catch (error) {
    console.error('Error in extra-details-patients/[id] DELETE route:', error);
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 