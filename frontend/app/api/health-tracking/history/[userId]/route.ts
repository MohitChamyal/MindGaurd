import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('Received request with params:', {
      userId: params.userId,
      type,
      page,
      limit
    });

    // Validate parameters
    if (!type || !['chat', 'questionnaire', 'report'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be either "chat", "questionnaire", or "report"' },
        { status: 400 }
      );
    }

    if (!params.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Forward the request to your backend server
    try {
      const backendUrl = `http://127.0.0.1:3001/api/health-tracking/history/${params.userId}?type=${type}&page=${page}&limit=${limit}`;
      console.log('Attempting to fetch from backend:', backendUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: response.url
        };
        console.error('Backend error details:', errorDetails);
        
        // Return appropriate error based on status code
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'No history found for this user' },
            { status: 404 }
          );
        }

        // For other error status codes
        return NextResponse.json(
          { 
            error: 'Backend server error',
            details: errorDetails
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Successfully received data from backend');
      
      // Validate the response data
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return NextResponse.json(
          { items: [], total: 0, page, limit },
          { status: 200 }
        );
      }
      
      return NextResponse.json(data);
    } catch (fetchError: unknown) {
      console.error('Fetch error:', {
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        name: fetchError instanceof Error ? fetchError.name : 'Error',
        cause: fetchError instanceof Error ? fetchError.cause : undefined
      });

      // Handle specific fetch errors
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out while connecting to backend server' },
          { status: 504 }
        );
      }

      if (fetchError instanceof Error && 
          fetchError.cause && 
          typeof fetchError.cause === 'object' && 
          fetchError.cause !== null &&
          'code' in fetchError.cause && 
          fetchError.cause.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { error: 'Could not connect to backend server. Please ensure it is running.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to connect to backend server',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('API route error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Error'
    });
    
    return NextResponse.json(
      { 
        error: 'An error occurred while processing your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}