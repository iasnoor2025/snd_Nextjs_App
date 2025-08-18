import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Simple test endpoint working');
    return NextResponse.json({
      success: true,
      message: 'Simple test endpoint working',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Simple test failed:', error);
    return NextResponse.json({ success: false, error: 'Simple test failed' }, { status: 500 });
  }
}
