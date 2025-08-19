import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing cron service via API...');

    // Import and test the cron service
    const { cronService } = await import('@/lib/services/cron-service');
    
    const testResult = await cronService.testCronService();

    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Cron service test completed successfully',
        result: testResult,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Cron service test failed',
        error: testResult.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in cron service test API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test cron service',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { cronService } = await import('@/lib/services/cron-service');
    const status = cronService.getStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Cron service status retrieved',
      status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get cron service status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
