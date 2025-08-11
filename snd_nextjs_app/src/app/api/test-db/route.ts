import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { timesheets } from '@/lib/drizzle/schema';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection by counting timesheets
    const result = await db
      .select({ count: timesheets.id })
      .from(timesheets)
      .limit(1);
    
    console.log('Database connection successful, result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result: result.length > 0 ? 'Timesheet table accessible' : 'Timesheet table empty but accessible'
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
