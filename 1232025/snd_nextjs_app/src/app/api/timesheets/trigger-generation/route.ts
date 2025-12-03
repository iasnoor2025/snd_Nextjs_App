import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Manual timesheet generation triggered via API...');

    // Import and use the cron service to trigger timesheet generation
    const { cronService } = await import('@/lib/services/cron-service');
    
    // Ensure cron service is initialized
    if (!cronService.getStatus().isInitialized) {
      await cronService.initialize();
    }

    // Trigger timesheet generation
    const result = await cronService.triggerTimesheetGeneration();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Timesheet generation completed successfully',
        created: result.created,
        errors: result.errors,
        progress: result.progress,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Timesheet generation failed',
        errors: result.errors,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in manual timesheet generation API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger timesheet generation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Timesheet trigger generation endpoint is available',
    status: 'ready',
  });
}
