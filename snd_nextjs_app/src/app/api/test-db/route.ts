import { db } from '@/lib/db';
import { employees } from '@/lib/drizzle/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Test DB API - Starting...');
    
    // Simple test: count employees
    const result = await db
      .select({ count: employees.id })
      .from(employees)
      .limit(1);
    
    console.log('🧪 Test DB API - Result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      result: result.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🧪 Test DB API - Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
