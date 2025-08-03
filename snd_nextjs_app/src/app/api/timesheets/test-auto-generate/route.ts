import { NextRequest, NextResponse } from 'next/server';
import { autoGenerateTimesheets } from '@/lib/timesheet-auto-generator';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting test auto-generation...');
    
    const result = await autoGenerateTimesheets();

    console.log('Test auto-generation result:', result);

    if (result.success) {
      return NextResponse.json({
        ...result,
        debug: {
          timestamp: new Date().toISOString(),
          message: 'Test auto-generation completed successfully'
        }
      });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Error in test auto-generation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test auto-generation', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 