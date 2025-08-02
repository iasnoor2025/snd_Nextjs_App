import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await request.json();
    const rentalId = params.id;
    const itemId = params.itemId;

    console.log('Updating rental item:', { rentalId, itemId, body });

    // Validate required fields
    const missingFields = [];
    if (!body.equipmentName) missingFields.push('equipmentName');
    if (!body.quantity) missingFields.push('quantity');
    if (!body.unitPrice) missingFields.push('unitPrice');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          receivedData: body 
        },
        { status: 400 }
      );
    }

    // Update rental item
    const rentalItem = await DatabaseService.updateRentalItem(parseInt(itemId), {
      equipmentId: body.equipmentId ? parseInt(body.equipmentId) : null,
      equipmentName: body.equipmentName,
      quantity: parseInt(body.quantity),
      unitPrice: parseFloat(body.unitPrice),
      totalPrice: parseFloat(body.totalPrice || 0),
      days: parseInt(body.days) || 1,
      rateType: body.rateType || 'daily',
      operatorId: body.operatorId ? parseInt(body.operatorId) : null,
      status: body.status || 'active',
      notes: body.notes || '',
    });

    return NextResponse.json(rentalItem);
  } catch (error) {
    console.error('Error updating rental item:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update rental item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const rentalId = params.id;
    const itemId = params.itemId;

    console.log('Deleting rental item:', { rentalId, itemId });

    // Delete rental item
    await DatabaseService.deleteRentalItem(parseInt(itemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rental item:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete rental item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 