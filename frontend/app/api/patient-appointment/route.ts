import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

// Helper function to map mental health concern values to more descriptive terms
function mapMentalHealthConcern(concern: string | undefined): string {
  if (!concern) return "";
  
  // Map common abbreviations or codes to full descriptions
  const mappings: Record<string, string> = {
    "anxiety": "Anxiety Disorder",
    "depression": "Clinical Depression",
    "ptsd": "Post-Traumatic Stress Disorder",
    "bipolar": "Bipolar Disorder",
    "ocd": "Obsessive Compulsive Disorder",
    "adhd": "Attention Deficit Hyperactivity Disorder",
    "schizo": "Schizophrenia",
    "eating": "Eating Disorder"
  };
  
  // Check if we have a mapping for this concern (case insensitive)
  const lowerConcern = concern.toLowerCase();
  for (const [key, value] of Object.entries(mappings)) {
    if (lowerConcern.includes(key)) {
      return value;
    }
  }
  
  // If no match found, return the original concern
  return concern;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Patient appointment POST route called");
    
    // Parse the request body
    const body = await request.json();
    console.log("Request body:", body);
    
    // Check for required fields
    if (!body.doctorId || !body.patientName || !body.patientEmail) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get auth token from request headers
    const token = request.headers.get('authorization');
    
    // First save the appointment data
    console.log("Saving appointment data");
    const appointmentResponse = await fetch(`${apiUrl}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token })
      },
      body: JSON.stringify(body)
    });
    
    if (!appointmentResponse.ok) {
      const errorData = await appointmentResponse.json();
      return NextResponse.json(
        { 
          status: 'error', 
          message: errorData.msg || 'Failed to create appointment',
          error: errorData.error
        },
        { status: appointmentResponse.status }
      );
    }
    
    // Now save to extra-details-patients
    console.log("Saving patient details to extradetailspatients");
    
    // Format the data for the extradetailspatients API
    const patientData = {
      doctorId: body.doctorId,
      doctorName: body.doctorName || "Doctor", // Provide default values if missing
      doctorSpecialty: body.doctorSpecialty || "Specialist",
      patientName: body.patientName,
      patientEmail: body.patientEmail,
      patientAge: body.patientAge || "",
      patientGender: body.patientGender || "",
      // Map mental health concern values to more descriptive terms
      mentalHealthConcern: mapMentalHealthConcern(body.mentalHealthConcern),
      hasCompletedQuestionnaire: body.hasCompletedQuestionnaire || false,
      appointmentRequestDate: new Date().toISOString(),
      status: "requested"
    };
    
    // Log the formatted data for debugging
    console.log("Formatted patient data:", patientData);
    
    const patientResponse = await fetch(`${apiUrl}/api/extra-details-patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token })
      },
      body: JSON.stringify(patientData)
    });
    
    if (!patientResponse.ok) {
      // Just log this error but don't fail the request since appointment was saved
      console.error("Failed to save patient details:", await patientResponse.json());
    }
    
    // Return success response with appointment data
    const appointmentData = await appointmentResponse.json();
    return NextResponse.json({
      status: 'success',
      message: 'Appointment and patient details created successfully',
      data: appointmentData
    });
  } catch (error) {
    console.error('Error in patient-appointment POST route:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 