import { NextResponse } from 'next/server';

export async function GET({ params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log('Simple leave request with ID:', id);
    
    return NextResponse.json({
      success: true,
      message: 'Simple route working',
      id: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Simple route error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
