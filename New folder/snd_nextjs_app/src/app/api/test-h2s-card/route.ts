import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';


/**
 * Test endpoint to generate H2S card
 * 
 * Usage:
 * POST /api/test-h2s-card
 * Body: { employeeId: number, trainingId: number }
 * 
 * This is a helper endpoint for testing. In production,
 * use: POST /api/employee/[id]/training/[trainingId]/h2s-card-pdf
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, trainingId } = body;

    if (!employeeId || !trainingId) {
      return NextResponse.json(
        { error: 'employeeId and trainingId are required' },
        { status: 400 }
      );
    }

    // Forward request to actual endpoint
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/employee/${employeeId}/training/${trainingId}/h2s-card-pdf`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in test H2S card endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to generate H2S card', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

