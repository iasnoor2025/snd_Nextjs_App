import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 TEST BULK APPROVE - API called!');
    console.log('🔍 TEST BULK APPROVE - Request URL:', request.url);
    console.log('🔍 TEST BULK APPROVE - Request method:', request.method);
    
    const body = await request.json();
    console.log('🔍 TEST BULK APPROVE - Request body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test bulk approve API called successfully',
      receivedData: body
    });
  } catch (error) {
    console.error('🔍 TEST BULK APPROVE - Error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
} 