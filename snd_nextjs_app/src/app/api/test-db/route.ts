import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing basic API functionality...');
    
    // Test basic functionality first
    console.log('✅ Basic API route working');
    
    // Test environment variables
    console.log('Environment check:');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Basic API route working',
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'General error: ' + (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
