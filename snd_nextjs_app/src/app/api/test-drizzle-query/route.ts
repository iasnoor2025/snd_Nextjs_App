import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employeeAssignments } from '../../../../drizzle/schema';

export async function GET() {
  try {
    // Test a simple Drizzle query
    const result = await db.select().from(employeeAssignments).limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Drizzle query successful',
      count: result.length,
      result: result
    });
  } catch (error) {
    console.error('Drizzle query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Drizzle query failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
