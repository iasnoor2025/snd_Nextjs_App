import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Only allow this in development or with proper authentication
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET;

      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('Initializing cron service via API...');

    // Dynamic import to avoid client-side bundling
    const { cronService } = await import('@/lib/services/cron-service');
    cronService.initialize();

    const status = cronService.getStatus();

    return NextResponse.json({
      success: true,
      message: 'Cron service initialized successfully',
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error initializing cron service:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize cron service',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Dynamic import to avoid client-side bundling
    const { cronService } = await import('@/lib/services/cron-service');
    const status = cronService.getStatus();

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting cron service status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get cron service status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
