import { NextRequest, NextResponse } from 'next/server';
import { apiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const doctorId = searchParams.get('doctorId');

    if (!action) {
      return NextResponse.json(
        { status: 'error', message: 'Action parameter is required' },
        { status: 400 }
      );
    }

    if (action === 'dumpCollections') {
      // Call backend debug endpoint to get direct collection data
      const response = await fetch(`${apiUrl}/api/debug/dump-collections?doctorId=${doctorId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get debug data');
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { status: 'error', message: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Error in debug API',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 