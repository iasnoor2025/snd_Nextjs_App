import { autoGenerateTimesheets } from '@/lib/timesheet-auto-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    console.log('Starting auto-generation request...');

    // Use the cron service to trigger timesheet generation
    const { cronService } = await import('@/lib/services/cron-service');
    
    // Ensure cron service is initialized
    if (!cronService.getStatus().isInitialized) {
      await cronService.initialize();
    }

    // Add timeout protection (5 minutes)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => {
          reject(new Error('Auto-generation timed out after 5 minutes'));
        },
        5 * 60 * 1000
      );
    });

    const resultPromise = cronService.triggerTimesheetGeneration();

    // Race between timeout and completion
    const result = (await Promise.race([resultPromise, timeoutPromise])) as any;

    console.log('Auto-generation result:', result);

    if (result && result.success) {
      return NextResponse.json(result);
    } else {
      console.error('Auto-generation failed:', result);
      return NextResponse.json(result || { success: false, error: 'No result returned' }, { status: 500 });
    }
  } catch (error) {
    console.error('Auto-generation API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const stackTrace = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to auto-generate timesheets',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? stackTrace : undefined,
      },
      { status: 500 }
    );
    }
  }
