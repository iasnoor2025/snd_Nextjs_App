import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Initialize cron service
    try {
      const { cronService } = await import('@/lib/services/cron-service');
      await cronService.initialize();
      // Optionally trigger an immediate timesheet generation for testing
      if (process.env.NODE_ENV === 'development') {
        try {
          const result = await cronService.triggerTimesheetGeneration();
        } catch (triggerError) {
          console.error('Failed to trigger initial timesheet generation:', triggerError);
        }
      }
    } catch (cronError) {
      console.error('Failed to initialize cron service:', cronError);
    }

    // Add any other startup tasks here
    // For example:
    // - Database connection checks
    // - Environment validation
    // - Service initialization
    // - Cache warming

    return NextResponse.json({
      success: true,
      message: 'Application startup completed successfully',
      services: {
        cron: 'initialized',
      },
    });
  } catch (error) {
    console.error('Startup failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete startup process',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Startup endpoint is available',
    status: 'ready',
  });
}
