import { NextRequest, NextResponse } from 'next/server';
import { autoGenerateTimesheets } from '@/lib/timesheet-auto-generator';

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting timesheet auto-generation request');
    
    // Add timeout protection (5 minutes)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Auto-generation timed out after 5 minutes'));
      }, 5 * 60 * 1000);
    });
    
    const resultPromise = autoGenerateTimesheets();
    
    // Race between timeout and completion
    const result = await Promise.race([resultPromise, timeoutPromise]);
    
    console.log('API: Auto-generation completed with result:', {
      success: result.success,
      created: result.created,
      errorCount: result.errors.length
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      console.error('API: Auto-generation failed with errors:', result.errors);
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('API: Unexpected error during auto-generation:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to auto-generate timesheets',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? stackTrace : undefined
      },
      { status: 500 }
    );
  }
}
