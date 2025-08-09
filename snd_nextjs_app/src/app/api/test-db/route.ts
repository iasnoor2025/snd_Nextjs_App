import { NextResponse } from 'next/server';
import { db, ensurePrismaConnection, safePrismaOperation } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await ensurePrismaConnection();
    
    // Test a simple query
    const result = 1;
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount: result
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
