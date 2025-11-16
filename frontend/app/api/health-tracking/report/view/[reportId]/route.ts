import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!params.reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Forward the request to your backend server
    try {
      const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/health-tracking/report/view/${params.reportId}?userId=${userId}`;
      console.log('Attempting to fetch report from backend:', backendUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(backendUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        next: { revalidate: 0 },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Log the response status and URL for debugging
      console.log('Backend response received:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Backend error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: response.url
        });
        
        // Return appropriate error based on status code
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Report not found' },
            { status: 404 }
          );
        }

        // For other error status codes
        return NextResponse.json(
          { 
            error: 'Backend server error',
            details: errorData
          },
          { status: response.status }
        );
      }

      // Get the Content-Type from the response
      const contentType = response.headers.get('content-type');
      
      // Check if it's a PDF or other file type that should be streamed
      if (contentType && (
          contentType.includes('application/pdf') || 
          contentType.includes('application/octet-stream') ||
          contentType.includes('image/')
        )) {
        // For binary files, stream the response
        const blob = await response.blob();
        
        // Create a new response with the blob and preserve headers
        const newResponse = new NextResponse(blob, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': response.headers.get('content-disposition') || 'inline',
          }
        });
        
        return newResponse;
      }
      
      // For JSON responses (like metadata)
      const data = await response.json();
      return NextResponse.json(data);
      
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);

      // Handle specific fetch errors
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out while connecting to backend server' },
          { status: 504 }
        );
      }

      if (fetchError.cause?.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { error: 'Could not connect to backend server. Please ensure it is running.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to connect to backend server',
          details: fetchError.message
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { 
        error: 'An error occurred while processing your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 