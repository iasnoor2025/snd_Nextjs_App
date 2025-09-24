import { RentalService } from '@/lib/services/rental-service';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { itemId } = await params;
  try {
    const body = await request.json();

    // Get current rental item to check if operator changed
    const newOperatorId = body.operatorId ? parseInt(body.operatorId) : null;

    // Validate required fields
    const missingFields: string[] = [];
    if (!body.equipmentName) missingFields.push('equipmentName');
    if (!body.unitPrice) missingFields.push('unitPrice');

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(', ')}`,
          receivedData: body,
        },
        { status: 400 }
      );
    }

    // Update rental item
    const rentalItem = await RentalService.updateRentalItem(parseInt(itemId), {
      equipmentId: body.equipmentId ? parseInt(body.equipmentId) : null,
      equipmentName: body.equipmentName,
      unitPrice: parseFloat(body.unitPrice),
      totalPrice: parseFloat(body.totalPrice || body.unitPrice),
      rateType: body.rateType || 'daily',
      operatorId: newOperatorId,
      status: body.status || 'active',
      notes: body.notes || '',
    });

    // Handle different operator change scenarios
    // Temporarily commented out to test quotation generation
    /*
    if (actionType === 'handover' && newOperatorId !== previousOperatorId) {
      // Scenario 1: Operator Changes with handover
      if (newOperatorId !== undefined && newOperatorId !== null) {
        await handleOperatorHandover(rentalId, previousOperatorId, newOperatorId, body.equipmentName);
      }
    } else if (actionType === 'remove' && previousOperatorId) {
      // Scenario 2: Operator Removed - delete assignment
      await deleteOperatorAssignment(rentalId, previousOperatorId);
    } else if (actionType === 'add' && newOperatorId && !previousOperatorId) {
      // Scenario 3: New Operator Added
      if (newOperatorId !== undefined && newOperatorId !== null) {
        await createNewOperatorAssignment(rentalId, newOperatorId, body.equipmentName);
      }
    } else if (actionType === 'update' && newOperatorId !== previousOperatorId) {
      // Scenario 4: Update operator based on rental status
      if (newOperatorId !== undefined && newOperatorId !== null) {
        const rental = await RentalService.getRental(parseInt(rentalId));
        if (rental?.status === 'active') {
          // If rental is active, use handover logic
          await handleOperatorHandover(rentalId, previousOperatorId, newOperatorId, body.equipmentName);
        } else {
          // If rental is not active, just update the operator
          await updateOperatorInRentalItem(rentalId, previousOperatorId, newOperatorId, body.equipmentName);
        }
      }
    }
    */

    return NextResponse.json(rentalItem);
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to update rental item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions removed - not currently used in commented-out logic

// All helper functions removed - not currently used in commented-out logic

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { itemId } = await params;
  try {
    // Delete rental item (this now includes automatic assignment cleanup)
    const success = await RentalService.deleteRentalItem(parseInt(itemId));

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete rental item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to delete rental item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
