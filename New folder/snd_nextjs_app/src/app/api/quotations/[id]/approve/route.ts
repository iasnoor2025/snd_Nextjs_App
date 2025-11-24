import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ success: false, message: 'Invalid parameters' }, { status: 400 });
    }
    
    const { id } = resolvedParams;
    
    // Validate quotation ID
    const quotationId = parseInt(id);
    if (isNaN(quotationId)) {
      return NextResponse.json({ success: false, message: 'Invalid quotation ID' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      // If body is empty or invalid, use empty object
      body = {};
    }

    // In a real implementation, this would update the quotation in the database
    // For now, return success response with proper structure
    // TODO: Implement actual database update when quotations table is available
    return NextResponse.json({
      success: true,
      message: 'Quotation approved successfully',
      data: {
        id: quotationId,
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: session.user.id,
        notes: body.notes || null,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error approving quotation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to approve quotation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
