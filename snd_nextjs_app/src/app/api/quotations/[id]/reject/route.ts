import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // In a real implementation, this would call the Laravel API
    // const response = await fetch(`${process.env.LARAVEL_API_URL}/api/quotations/${id}/reject`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(body),
    // });

    // For now, return success response
    return NextResponse.json({
      success: true,
      message: 'Quotation rejected successfully',
      data: {
        id: parseInt(id),
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        notes: body.notes || null
      }
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to reject quotation' },
      { status: 500 }
    );
  }
}
