import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { roles } from '@/lib/drizzle/schema';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test basic database connectivity
    const testQuery = await db.select().from(roles).limit(1);
    
    console.log('✅ Database connection successful:', { 
      rolesFound: testQuery.length,
      sampleRole: testQuery[0] || null
    });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      rolesFound: testQuery.length,
      sampleRole: testQuery[0] || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : 'Unknown error type';
    
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection test failed',
        error: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
