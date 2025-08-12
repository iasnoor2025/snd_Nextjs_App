import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employees } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic database connection
    const result = await db.select({ count: sql`count(*)` }).from(employees);
    
    console.log('Database test successful:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: result
    });
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
