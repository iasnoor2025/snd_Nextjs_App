import { db } from '@/lib/db';
import { equipment } from '@/lib/drizzle/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple test query
    const result = await db.select({ count: equipment.id }).from(equipment).limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result: result.length > 0 ? 'Equipment table accessible' : 'Equipment table empty but accessible'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
