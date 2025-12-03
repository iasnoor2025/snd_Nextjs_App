import { autoGenerateTimesheets } from '@/lib/timesheet-auto-generator';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';

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

// Test endpoint to check database connection
export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test database connection
    const testResult = await db.execute(sql`SELECT 1 as test`);
    console.log('Database connection test successful:', testResult);
    
    // Check employee assignments
    const assignmentsResult = await db.execute(sql`
      SELECT id, employee_id, project_id, rental_id, start_date, end_date, status 
      FROM employee_assignments 
      LIMIT 5
    `);
    
    // Check timesheets
    const timesheetsResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM timesheets WHERE deleted_at IS NULL
    `);
    
    // Check existing timesheets for the assignments
    let existingTimesheetsDetails = [];
    if (assignmentsResult.rows && assignmentsResult.rows.length > 0) {
      for (const assignment of assignmentsResult.rows) {
        const timesheetsForAssignment = await db.execute(sql`
          SELECT id, employee_id, date, status 
          FROM timesheets 
          WHERE employee_id = ${assignment.employee_id} 
            AND DATE(date) >= ${assignment.start_date}
            AND deleted_at IS NULL
          ORDER BY date
        `);
        
        existingTimesheetsDetails.push({
          assignment_id: assignment.id,
          employee_id: assignment.employee_id,
          start_date: assignment.start_date,
          existing_timesheets: timesheetsForAssignment.rows || []
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      testResult,
      assignments: assignmentsResult.rows || [],
      timesheetsCount: timesheetsResult.rows?.[0]?.count || 0,
      existingTimesheetsDetails,
      debug: {
        currentDate: new Date().toISOString(),
        currentDateString: new Date().toDateString(),
        assignmentsCount: assignmentsResult.rows?.length || 0
      }
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
