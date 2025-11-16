// This file can be deleted since we're calling the backend directly

// If you want to keep the file for future use, you can add this comment:
// Direct backend communication is currently being used instead of this route
// See frontend/components/patient/ai-chat.tsx for the implementation

import { NextRequest, NextResponse } from 'next/server';

// Configure the route for API endpoints
export const runtime = 'edge';
export const preferredRegion = 'auto';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    if (!params.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { messages, sessionId, metadata } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Forward the request to your backend server
    try {
      const response = await fetch('http://127.0.0.1:8000/api/health-tracking/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.userId,
          messages,
          sessionId,
          metadata,
          interactionType: 'chat'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Backend error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: response.url
        });

        // Return a proper error response
        return NextResponse.json(
          { 
            error: 'Failed to save chat history',
            details: errorData
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Fetch error:', {
        message: fetchError.message,
        name: fetchError.name,
        cause: fetchError.cause
      });

      // Return a proper error response for connection issues
      return NextResponse.json(
        { 
          error: 'Failed to connect to chat service',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('API route error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 