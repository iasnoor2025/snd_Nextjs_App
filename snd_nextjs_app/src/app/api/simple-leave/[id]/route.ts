import { NextResponse } from 'next/server';

export async function GET(_request: any, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
