import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';

export async function GET() {
  try {
    // Simple test query
    const result = await db.execute('SELECT 1 as test');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      result: result
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
