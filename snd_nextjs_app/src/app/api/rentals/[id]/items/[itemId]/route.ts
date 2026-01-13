import { RentalService } from '@/lib/services/rental-service';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  try {
    const body = await request.json();

    // Get current rental item to check if operator changed
    const currentItem = await RentalService.getRentalItem(parseInt(itemId));
    const previousOperatorId = currentItem?.operatorId || null;
    const rentalId = id;
    const newOperatorId = body.operatorId ? parseInt(body.operatorId) : null;

    // If only updating completedDate, skip other validations
    const isOnlyUpdatingCompletedDate = body.completedDate && 
      !body.equipmentName && 
      !body.unitPrice && 
      !body.equipmentId && 
      !body.operatorId && 
      !body.status && 
      !body.actionType;

    // Validate required fields (skip if only updating completedDate)
    if (!isOnlyUpdatingCompletedDate) {
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
    }

    // Handle different operator change scenarios
    const actionType = body.actionType;
    let rentalItem;

    // If only updating completedDate, handle it separately
    if (isOnlyUpdatingCompletedDate) {
      rentalItem = await RentalService.updateRentalItem(parseInt(itemId), {
        completedDate: body.completedDate,
      });
      return NextResponse.json(rentalItem);
    }

    if (actionType === 'handover' && newOperatorId !== previousOperatorId) {
      // Scenario 1: Operator Changes with handover - Don't update the old item, complete it and create new one
      if (newOperatorId !== undefined && newOperatorId !== null) {
        const handoverStartDate = body.startDate && body.startDate !== '' ? body.startDate : null;

        rentalItem = await handleOperatorHandover(parseInt(itemId), parseInt(rentalId), previousOperatorId, newOperatorId, body.equipmentName, currentItem, handoverStartDate);
      }
    } else {
      // For non-handover actions, update the rental item normally
      rentalItem = await RentalService.updateRentalItem(parseInt(itemId), {
        equipmentId: body.equipmentId ? parseInt(body.equipmentId) : null,
        equipmentName: body.equipmentName,
        unitPrice: parseFloat(body.unitPrice),
        totalPrice: parseFloat(body.totalPrice || body.unitPrice),
        rateType: body.rateType || 'daily',
        operatorId: newOperatorId,
        supervisorId: body.supervisorId ? parseInt(body.supervisorId) : null,
        status: body.status || 'active',
        notes: body.notes || '',
        startDate: body.startDate && body.startDate !== '' ? body.startDate : null,
        completedDate: body.completedDate || undefined,
      });

      // Handle other operator change scenarios
      if (actionType === 'remove' && previousOperatorId) {
        // Scenario 2: Operator Removed - delete assignment
        await deleteOperatorAssignment(parseInt(rentalId), previousOperatorId);
      } else if (actionType === 'add' && newOperatorId && !previousOperatorId) {
        // Scenario 3: New Operator Added
        if (newOperatorId !== undefined && newOperatorId !== null) {
          await createNewOperatorAssignment(parseInt(rentalId), newOperatorId, body.equipmentName);
        }
      } else if (actionType === 'update' && newOperatorId !== previousOperatorId) {
        // Scenario 4: Update operator based on rental status
        if (newOperatorId !== undefined && newOperatorId !== null) {
          const rental = await RentalService.getRental(parseInt(rentalId));
          if (rental?.status === 'active') {
            // If rental is active, use handover logic
            const handoverStartDate = body.startDate && body.startDate !== '' ? body.startDate : null;
            await handleOperatorHandover(parseInt(itemId), parseInt(rentalId), previousOperatorId, newOperatorId, body.equipmentName, currentItem, handoverStartDate);
          } else {
            // If rental is not active, just update the operator
            await updateOperatorInRentalItem(parseInt(rentalId), previousOperatorId, newOperatorId, body.equipmentName);
          }
        }
      }
    }

    return NextResponse.json(rentalItem);
  } catch (error) {
    console.error('Error updating rental item:', error);
    return NextResponse.json(
      {
        error: 'Failed to update rental item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions for operator assignment actions

// Handle operator handover (complete old item, create new item with new operator)
async function handleOperatorHandover(itemId: number, rentalId: number, previousOperatorId: number | null, newOperatorId: number, equipmentName: string, currentItem: any, newStartDate: string | null = null) {
  const { db } = await import('@/lib/drizzle');
  const { employeeAssignments, rentalItems } = await import('@/lib/drizzle/schema');
  const { eq, and } = await import('drizzle-orm');
  
  try {
    // Ensure we have the current item
    if (!currentItem) {
      currentItem = await RentalService.getRentalItem(itemId);
    }

    if (!currentItem) {
      throw new Error('Current rental item not found');
    }

    // Use provided start date or default to today
    const handoverStartDate = newStartDate || new Date().toISOString().split('T')[0];

    const handoverStartDateObj = new Date(handoverStartDate);
    
    // Calculate completed date (one day before handover start date)
    const previousDay = new Date(handoverStartDateObj);
    previousDay.setDate(previousDay.getDate() - 1);
    const completedDate = previousDay.toISOString().split('T')[0];
        // End previous operator assignment if exists
    if (previousOperatorId) {
      await db
        .update(employeeAssignments)
        .set({
          status: 'completed',
          endDate: completedDate,
          updatedAt: completedDate,
        })
        .where(
          and(
            eq(employeeAssignments.employeeId, previousOperatorId),
            eq(employeeAssignments.rentalId, rentalId),
            eq(employeeAssignments.status, 'active')
          )
        );
    }

    // Mark the old rental item as completed with the calculated completed date
    await db
      .update(rentalItems)
      .set({
        status: 'completed',
        completedDate: completedDate,
        updatedAt: completedDate,
      })
      .where(eq(rentalItems.id, currentItem.id));
    
    // Get rental details for calculating total
    const rental = await RentalService.getRental(rentalId);
    
    // Calculate total price for the new item
    const totalPrice = RentalService.calculateItemTotal({
      unitPrice: currentItem.unitPrice,
      quantity: 1,
      rateType: currentItem.rateType || 'daily',
      totalPrice: currentItem.totalPrice
    }, rental);
    
    const newItem = await RentalService.addRentalItem({
      rentalId: rentalId,
      equipmentId: currentItem.equipmentId,
      equipmentName: currentItem.equipmentName || equipmentName,
      unitPrice: parseFloat(currentItem.unitPrice?.toString() || '0'),
      totalPrice: totalPrice,
      rateType: currentItem.rateType || 'daily',
      operatorId: newOperatorId,
      status: 'active',
      notes: `Handover from operator ${previousOperatorId}`,
      startDate: handoverStartDate, // Use the provided start date
    });

    // Create new operator assignment with handover start date
    await createNewOperatorAssignment(rentalId, newOperatorId, equipmentName, handoverStartDate);

    // Return the newly created item
    return newItem;
  } catch (error) {
    console.error('Error in handleOperatorHandover:', error);
    throw error;
  }
}

// Delete operator assignment
async function deleteOperatorAssignment(rentalId: number, operatorId: number) {
  const { db } = await import('@/lib/drizzle');
  const { employeeAssignments } = await import('@/lib/drizzle/schema');
  const { eq, and } = await import('drizzle-orm');
  
  try {
    await db
      .delete(employeeAssignments)
      .where(
        and(
          eq(employeeAssignments.employeeId, operatorId),
          eq(employeeAssignments.rentalId, rentalId)
        )
      );
  } catch (error) { 
    console.error('Error in deleteOperatorAssignment:', error);
    throw error;
  }
}

// Create new operator assignment
async function createNewOperatorAssignment(rentalId: number, operatorId: number, equipmentName: string, assignmentStartDate: string | null = null) {
  const { db } = await import('@/lib/drizzle');
  const { employeeAssignments } = await import('@/lib/drizzle/schema');
  
  try {
    // Get rental details
    const rental = await RentalService.getRental(rentalId);
    if (!rental) return;

    // Use provided assignment start date (for handovers) or fall back to rental start date
    const startDate = assignmentStartDate || (rental.startDate === '2099-12-31' ? new Date().toISOString().split('T')[0] : rental.startDate);
    const endDate = rental.expectedEndDate;

    await db.insert(employeeAssignments).values({
      employeeId: operatorId,
      rentalId: rentalId,
      projectId: rental.projectId || null,
      startDate: startDate,
      endDate: endDate || null,
      status: rental.status === 'active' || rental.status === 'approved' ? 'active' : 'pending',
      notes: `Operator assignment for rental ${rental.rentalNumber} - Equipment: ${equipmentName}`,
      location: rental.locationId ? `Location ID: ${rental.locationId}` : 'Rental Site',
      updatedAt: new Date().toISOString().split('T')[0],
    } as any);
  } catch (error) {
    console.error('Error in createNewOperatorAssignment:', error);
    throw error;
  }
}

// Update operator in rental item (for non-active rentals)
async function updateOperatorInRentalItem(rentalId: number, previousOperatorId: number | null, newOperatorId: number, equipmentName: string) {
  const { db } = await import('@/lib/drizzle');
  const { employeeAssignments } = await import('@/lib/drizzle/schema');
  const { eq, and } = await import('drizzle-orm');
  
  try {
    // If there's a previous operator assignment, update it
    if (previousOperatorId) {
      const existingAssignments = await db
        .select()
        .from(employeeAssignments)
        .where(
          and(
            eq(employeeAssignments.employeeId, previousOperatorId),
            eq(employeeAssignments.rentalId, rentalId)
          )
        );

      if (existingAssignments.length > 0 && existingAssignments[0]?.id) {
        // Update existing assignment
        await db
          .update(employeeAssignments)
          .set({
            employeeId: newOperatorId,
            updatedAt: new Date().toISOString().split('T')[0],
          })
          .where(eq(employeeAssignments.id, existingAssignments[0].id));
        return;
      }
    }

    // If no existing assignment, create new one
    await createNewOperatorAssignment(rentalId, newOperatorId, equipmentName);
  } catch (error) {
    console.error('Error in updateOperatorInRentalItem:', error);
    throw error;
  }
}

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
