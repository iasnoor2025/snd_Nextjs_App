import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';

export async function GET() {
  try {
    // Test if Drizzle db object is available
    if (!db) {
      throw new Error('Drizzle db object is not available');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Drizzle db object is available',
      dbType: typeof db
    });
  } catch (error) {
    console.error('Drizzle test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Drizzle test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
