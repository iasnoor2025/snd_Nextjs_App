import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Test invoice API called with:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test invoice API working',
      receivedData: body
    });
  } catch (error) {
    console.error('Test invoice API error:', error);
    return NextResponse.json({
      error: 'Test invoice API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
