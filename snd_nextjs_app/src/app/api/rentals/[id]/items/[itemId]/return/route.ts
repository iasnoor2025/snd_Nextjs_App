import { RentalService } from '@/lib/services/rental-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const returnDate = body.returnDate || new Date().toISOString().split('T')[0];

    // Get the current rental item
    const currentItem = await RentalService.getRentalItem(parseInt(itemId));
    
    if (!currentItem) {
      return NextResponse.json(
        { error: 'Rental item not found' },
        { status: 404 }
      );
    }

    // Check if item is already completed
    if (currentItem.status === 'completed') {
      return NextResponse.json(
        { error: 'This item is already completed' },
        { status: 400 }
      );
    }

    // Update the rental item to completed
    const updatedItem = await RentalService.updateRentalItem(parseInt(itemId), {
      status: 'completed',
      completedDate: returnDate,
      operatorId: currentItem.operatorId,
      equipmentId: currentItem.equipmentId,
      equipmentName: currentItem.equipmentName,
      unitPrice: parseFloat(currentItem.unitPrice?.toString() || '0'),
      totalPrice: parseFloat(currentItem.totalPrice?.toString() || '0'),
      rateType: currentItem.rateType || 'daily',
    });

    // Also update the operator assignment if exists
    if (currentItem.operatorId) {
      const { db } = await import('@/lib/drizzle');
      const { employeeAssignments } = await import('@/lib/drizzle/schema');
      const { eq, and } = await import('drizzle-orm');

      await db
        .update(employeeAssignments)
        .set({
          status: 'completed',
          endDate: returnDate,
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(
          and(
            eq(employeeAssignments.employeeId, currentItem.operatorId),
            eq(employeeAssignments.rentalId, currentItem.rentalId),
            eq(employeeAssignments.status, 'active')
          )
        );
    }

    return NextResponse.json({
      message: 'Equipment returned successfully',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error completing rental item:', error);
    return NextResponse.json(
      {
        error: 'Failed to return equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

