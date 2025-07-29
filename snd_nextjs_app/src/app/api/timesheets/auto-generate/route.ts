import { NextRequest, NextResponse } from 'next/server';
import { autoGenerateTimesheets } from '@/lib/timesheet-auto-generator';

export async function POST(request: NextRequest) {
  try {
    const result = await autoGenerateTimesheets();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Error auto-generating timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to auto-generate timesheets' },
      { status: 500 }
    );
  }
}
