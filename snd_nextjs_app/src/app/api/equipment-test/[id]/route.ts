import { NextResponse } from 'next/server';

export async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: id,
        name: 'Test Equipment',
        status: 'available'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch equipment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
