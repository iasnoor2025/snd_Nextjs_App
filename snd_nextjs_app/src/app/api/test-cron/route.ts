import { NextRequest, NextResponse } from 'next/server';
import { autoGenerateTimesheets } from '@/lib/timesheet-auto-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, secret } = body;

    // Simple secret check for development
    if (secret !== 'test-secret-123') {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    if (action === 'timesheets') {
      console.log('🧪 Manual trigger: Starting timesheet auto-generation...');
      const result = await autoGenerateTimesheets();
      
      return NextResponse.json({
        success: true,
        result,
        timestamp: new Date().toISOString(),
        message: 'Manual timesheet auto-generation completed'
      });
    }

    if (action === 'status') {
      return NextResponse.json({
        success: true,
        message: 'Test endpoint working',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "timesheets" or "status"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in test cron endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to execute test action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
