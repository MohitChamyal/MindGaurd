import { NextRequest, NextResponse } from 'next/server';

/**
 * API route handler for doctor-initiated patient registration
 * This creates a user if needed and then creates a patient registration
 */
export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const data = await request.json();
    
    // Extract doctor token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header missing' },
        { status: 401 }
      );
    }

    // Generate a random password for the new patient account
    const generateRandomPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    console.log('Processing patient registration initiated by doctor');
    
    // 1. First, create or find a user based on the email address
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: data.patientName.replace(/\s+/g, '_').toLowerCase(),
        email: data.patientEmail,
        password: generateRandomPassword(),
        isPatientAccount: true,
        createdByDoctor: true
      }),
    });

    const userData = await userResponse.json();
    let patientId;
    
    if (userData.success) {
      console.log('Created new user account for patient');
      patientId = userData.user.id;
    } else if (userData.msg === 'User already exists') {
      // Try to get the user ID from the existing account
      console.log('Patient account already exists, retrieving user ID');
      const existingUserResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/by-email?email=${encodeURIComponent(data.patientEmail)}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });
      
      const existingUserData = await existingUserResponse.json();
      if (existingUserData.success) {
        patientId = existingUserData.user._id;
      } else {
        throw new Error('Failed to retrieve existing user ID');
      }
    } else {
      throw new Error(userData.msg || 'Failed to create user account');
    }

    // 2. Now create the patient registration
    const registrationData = {
      ...data,
      patientId: patientId,
      registrationType: 'doctor_initiated'
    };

    console.log('Creating patient registration with patient ID:', patientId);
    
    const registrationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/patient-registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(registrationData)
    });

    const registrationData2 = await registrationResponse.json();

    if (!registrationResponse.ok) {
      throw new Error(registrationData2.message || 'Failed to create patient registration');
    }

    return NextResponse.json({
      success: true,
      message: 'Patient added successfully',
      data: {
        patientId,
        registration: registrationData2.data
      }
    });
  } catch (error) {
    console.error('Error processing doctor-initiated patient registration:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process patient registration' 
      },
      { status: 500 }
    );
  }
} 