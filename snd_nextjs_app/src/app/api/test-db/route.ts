import { db } from '@/lib/drizzle';
import { employeeLeaves } from '@/lib/drizzle/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await db.select().from(employeeLeaves).limit(1);
    console.log('Database connection successful, found', result.length, 'leave requests');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      leaveCount: result.length,
      sampleData: result[0] || null
    });
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
