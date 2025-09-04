import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Simple test route called');
    
    return NextResponse.json({
      success: true,
      message: 'Simple test route working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Simple test route error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
