import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('Database connection test result:', result);
    
    // Test if we can query the employee_assignments table
    const assignmentCount = await db.execute(sql`SELECT COUNT(*) as count FROM employee_assignments`);
    console.log('Employee assignments count:', assignmentCount);
    
    // Test if we can query the timesheets table
    const timesheetCount = await db.execute(sql`SELECT COUNT(*) as count FROM timesheets`);
    console.log('Timesheets count:', timesheetCount);
    
    // Check the actual structure of the timesheets table
    const tableStructure = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'timesheets' 
      ORDER BY ordinal_position
    `);
    console.log('Timesheets table structure:', tableStructure);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        connectionTest: result,
        assignmentCount: assignmentCount[0]?.count,
        timesheetCount: timesheetCount[0]?.count,
        tableStructure: tableStructure
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: 500 }
    );
  }
}
