import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming data
    const data = await request.json();
    
    // Log the data (for debugging)
    console.log('Patient details received:', data);
    
    // In a real application, we would save this data to a database
    // For now, we'll just simulate a successful response
    
    // Simulate database processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return a success response
    return NextResponse.json({
      status: 'success',
      message: 'Patient details saved successfully',
      data: {
        id: 'patient_' + Date.now(), // Simulate a generated ID
        ...data,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error saving patient details:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'An error occurred while saving patient details',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 