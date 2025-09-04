import { db } from '@/lib/drizzle';
import { employees } from '@/lib/drizzle/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Testing employee data...');
    
    // Get employee with ID 5
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, 5))
      .limit(1);
    
    console.log('Employee result:', employee);
    
    return NextResponse.json({
      success: true,
      employee: employee[0] || null
    });
  } catch (error) {
    console.error('Employee test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
