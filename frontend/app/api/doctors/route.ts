import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Get auth token for API requests
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
    
    // Fetch registered doctors from the backend API
    try {
      const backendUrl = `${apiUrl}/api/doctors`;
      console.log('Fetching registered doctors from:', backendUrl);
      
      const response = await fetch(backendUrl, {
        headers,
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching doctors: ${response.statusText}`);
      }
      
      const doctorsData = await response.json();
      console.log(`Found ${doctorsData.length} registered doctors`);
      
      // Transform the backend data to the format expected by the frontend
      // Mark all doctors as available regardless of verification status
      const formattedDoctors = doctorsData.map((doctor: any) => ({
        id: String(doctor._id),
        _id: String(doctor._id),
        name: doctor.fullName,
        fullName: doctor.fullName,
        email: doctor.email,
        specialty: doctor.specialization,
        specialization: doctor.specialization,
        yearsOfExperience: doctor.yearsOfExperience,
        rating: 4.5 + Math.random() * 0.5, // Simulated rating between 4.5-5.0
        reviews: Math.floor(50 + Math.random() * 150), // Random review count
        avatar: doctor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=random`,
        available: true, // Mark all doctors as available
        bookingLink: `https://cal.com/${doctor.fullName.toLowerCase().replace(/\s+/g, '-')}`
      }));
      
      return NextResponse.json({
        status: 'success',
        data: formattedDoctors
      });
    } catch (error) {
      console.error("Error fetching doctors from backend:", error);
      
      // If no doctors are found or there's an error, provide fallback data
      const fallbackDoctors = [
        {
          id: "1",
          _id: "1",
          name: "Dr. Devanshu Sharma",
          fullName: "Dr. Devanshu Sharma",
          email: "devanshu.sharma@mindguard.com",
          specialty: "Psychiatrist",
          specialization: "Psychiatrist",
          yearsOfExperience: 8,
          rating: 4.9,
          reviews: 124,
          avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=256&h=256&auto=format&fit=crop",
          available: true,
          bookingLink: "https://cal.com/devanshu-sharma-9noi9z"
        },
        {
          id: "2",
          _id: "2",
          name: "Dr. Priyanshu Thapliyal",
          fullName: "Dr. Priyanshu Thapliyal",
          email: "priyanshu.thapliyal@mindguard.com",
          specialty: "Therapist",
          specialization: "Therapist",
          yearsOfExperience: 5,
          rating: 4.8,
          reviews: 98,
          avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=256&h=256&auto=format&fit=crop",
          available: true,
          bookingLink: "https://cal.com/pandathap"
        }
      ];
      
      return NextResponse.json({
        status: 'success',
        data: fallbackDoctors,
        note: 'Using fallback data as no registered doctors were found'
      });
    }
  } catch (error) {
    console.error('Error in doctors API route:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'An error occurred while fetching doctors',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 