import { db } from '@/lib/drizzle';
import { employeeLeaves } from '@/lib/drizzle/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Testing leave request data...');
    
    // Get all leave requests
    const allLeaves = await db.select().from(employeeLeaves).limit(5);
    console.log('All leaves:', allLeaves);
    
    // Get specific leave request
    const specificLeave = await db
      .select()
      .from(employeeLeaves)
      .where(eq(employeeLeaves.id, 3))
      .limit(1);
    
    console.log('Specific leave:', specificLeave);
    
    return NextResponse.json({
      success: true,
      allLeaves,
      specificLeave: specificLeave[0] || null
    });
  } catch (error) {
    console.error('Leave test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
