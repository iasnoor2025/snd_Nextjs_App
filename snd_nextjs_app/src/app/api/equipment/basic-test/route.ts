import { NextResponse } from 'next/server';

export async function POST() {
  try {

    // Check environment variables
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
    const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
    const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

    // Test basic functionality
    const testData = {
      timestamp: new Date().toISOString(),
      environment: {
        hasUrl: !!ERPNEXT_URL,
        hasKey: !!ERPNEXT_API_KEY,
        hasSecret: !!ERPNEXT_API_SECRET,
        url: ERPNEXT_URL,
        keyLength: ERPNEXT_API_KEY?.length || 0,
        secretLength: ERPNEXT_API_SECRET?.length || 0,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Basic test successful',
      data: testData,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed basic test',
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
        },
      },
      { status: 500 }
    );
  } finally {
    
  }
}
