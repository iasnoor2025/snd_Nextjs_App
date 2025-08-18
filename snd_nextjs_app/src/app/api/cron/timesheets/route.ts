import { autoGenerateTimesheets } from '@/lib/timesheet-auto-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron service
    const authHeader = _request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await autoGenerateTimesheets();

    if (result.success) {
      return NextResponse.json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Error auto-generating timesheets:', error);
    return NextResponse.json({ error: 'Failed to auto-generate timesheets' }, { status: 500 });
  }
}
