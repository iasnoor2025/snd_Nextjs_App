import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  try {
    const body = await request.json();
    const rentalId = id;

    console.log('Updating rental item:', { rentalId, itemId, body });

    // Get current rental item to check if operator changed
    const currentItem = await DatabaseService.getRentalItem(parseInt(itemId));
    const previousOperatorId = currentItem?.operator_id;
    const newOperatorId = body.operatorId ? parseInt(body.operatorId) : null;

    // Validate required fields
    const missingFields: string[] = [];
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
      operatorId: newOperatorId,
      status: body.status || 'active',
      notes: body.notes || '',
    });

    // Handle operator assignment changes
    if (newOperatorId !== previousOperatorId) {
      try {
        // If there was a previous operator, end their assignment
        if (previousOperatorId) {
          await prisma.employeeAssignment.updateMany({
            where: {
              employee_id: previousOperatorId,
              rental_id: parseInt(rentalId),
              type: 'rental_item',
              status: 'active',
            },
            data: {
              status: 'inactive',
              end_date: new Date(),
            },
          });
        }

        // If there's a new operator, create a new assignment
        if (newOperatorId) {
          // Get rental details for assignment name
          const rental = await DatabaseService.getRental(parseInt(rentalId));
          const customerName = rental?.customer?.name || 'Unknown Customer';
          
          // Create employee assignment
          await prisma.employeeAssignment.create({
            data: {
              employee_id: newOperatorId,
              name: `${customerName} - ${body.equipmentName} Rental`,
              type: 'rental_item',
              location: 'Rental Site',
              start_date: new Date(),
              end_date: null,
              status: 'active',
              notes: `Assigned to rental item: ${body.equipmentName}`,
              rental_id: parseInt(rentalId),
              project_id: null,
            },
          });

          console.log(`Employee assignment updated for operator ${newOperatorId} on rental ${rentalId}`);
        }
      } catch (assignmentError) {
        console.error('Error updating employee assignment:', assignmentError);
        // Don't fail the rental item update if assignment update fails
        // Just log the error
      }
    }

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
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  try {
    const rentalId = id;

    console.log('Deleting rental item:', { rentalId, itemId });

    // Get current rental item to check if it has an operator
    const currentItem = await DatabaseService.getRentalItem(parseInt(itemId));
    const operatorId = currentItem?.operator_id;

    // Delete rental item
    await DatabaseService.deleteRentalItem(parseInt(itemId));

    // If the item had an operator, end their assignment
    if (operatorId) {
      try {
        await prisma.employeeAssignment.updateMany({
          where: {
            employee_id: operatorId,
            rental_id: parseInt(rentalId),
            type: 'rental_item',
            status: 'active',
          },
          data: {
            status: 'inactive',
            end_date: new Date(),
          },
        });

        console.log(`Employee assignment ended for operator ${operatorId} on rental ${rentalId}`);
      } catch (assignmentError) {
        console.error('Error ending employee assignment:', assignmentError);
        // Don't fail the rental item deletion if assignment update fails
        // Just log the error
      }
    }

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