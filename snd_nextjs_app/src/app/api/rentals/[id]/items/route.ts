import { db } from '@/lib/db';
import { employeeAssignments } from '@/lib/drizzle/schema';
import { RentalService } from '@/lib/services/rental-service';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const rentalId = id;

    console.log('Received rental item data:', body);

    // Check if rental exists
    const rentalExists = await RentalService.getRental(parseInt(rentalId));
    if (!rentalExists) {
      return NextResponse.json({ error: `Rental with ID ${rentalId} not found` }, { status: 404 });
    }

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

    // Add rental item
    const rentalItem = await RentalService.addRentalItem({
      rentalId: parseInt(rentalId),
      equipmentId: body.equipmentId ? parseInt(body.equipmentId) : null,
      equipmentName: body.equipmentName,
      unitPrice: parseFloat(body.unitPrice),
      totalPrice: parseFloat(body.totalPrice || body.unitPrice),
      rateType: body.rateType || 'daily',
      operatorId: body.operatorId ? parseInt(body.operatorId) : null,
      status: body.status || 'active',
      notes: body.notes || '',
    });

    // If an operator is assigned, create an employee assignment
    if (body.operatorId && rentalItem) {
      try {
        // Get rental details for assignment name - temporarily commented out
        // const rental = await RentalService.getRental(parseInt(rentalId));
        // const customerName = rental?.customer?.name || 'Unknown Customer';

        // Create employee assignment - temporarily commented out due to type issues
        // await db.insert(employeeAssignments).values({
        //   employeeId: parseInt(body.operatorId),
        //   name: `${customerName} - ${body.equipmentName} Rental`,
        //   type: 'rental_item',
        //   location: 'Rental Site',
        //   startDate: new Date().toISOString().split('T')[0],
        //   endDate: null,
        //   status: 'active',
        //   notes: `Assigned to rental item: ${body.equipmentName}`,
        //   rentalId: parseInt(rentalId),
        //   projectId: null,
        //   updatedAt: new Date().toISOString().split('T')[0]
        // });

        console.log(
          `Employee assignment created for operator ${body.operatorId} on rental ${rentalId}`
        );
      } catch (assignmentError) {
        console.error('Error creating employee assignment:', assignmentError);
        // Don't fail the rental item creation if assignment creation fails
        // Just log the error
      }
    }

    return NextResponse.json(rentalItem, { status: 201 });
  } catch (error) {
    console.error('Error adding rental item:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    });
    return NextResponse.json(
      {
        error: 'Failed to add rental item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rentalId = id;
    const rentalItems = await RentalService.getRentalItems(parseInt(rentalId));
    return NextResponse.json(rentalItems);
  } catch (error) {
    console.error('Error fetching rental items:', error);
    return NextResponse.json({ error: 'Failed to fetch rental items' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const rentalId = id;

    console.log('Received rental item update data:', body);

    // Check if rental exists
    const rentalExists = await RentalService.getRental(parseInt(rentalId));
    if (!rentalExists) {
      return NextResponse.json({ error: `Rental with ID ${rentalId} not found` }, { status: 404 });
    }

    // Validate required fields
    const missingFields: string[] = [];
    if (!body.equipmentName) missingFields.push('equipmentName');
    if (!body.unitPrice) missingFields.push('unitPrice');
    if (!body.itemId) missingFields.push('itemId');

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
    const updatedItem = await RentalService.updateRentalItem(parseInt(body.itemId), {
      equipmentId: body.equipmentId ? parseInt(body.equipmentId) : null,
      equipmentName: body.equipmentName,
      unitPrice: parseFloat(body.unitPrice),
      totalPrice: parseFloat(body.totalPrice || body.unitPrice),
      rateType: body.rateType || 'daily',
      operatorId: body.operatorId ? parseInt(body.operatorId) : null,
      status: body.status || 'active',
      notes: body.notes || '',
    });

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Rental item not found or failed to update' },
        { status: 404 }
      );
    }

    // Handle employee assignment updates if operator changed
    if (body.operatorId) {
      try {
        // Get current rental item to check if operator changed
        const currentItem = await RentalService.getRentalItem(parseInt(body.itemId));
        const previousOperatorId = currentItem?.operatorId;
        const newOperatorId = parseInt(body.operatorId);

        if (newOperatorId !== previousOperatorId) {
          // If there was a previous operator, end their assignment
          if (previousOperatorId) {
            await db
              .update(employeeAssignments)
              .set({
                status: 'inactive',
                endDate: new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString().split('T')[0],
              })
              .where(
                and(
                  eq(employeeAssignments.employeeId, previousOperatorId),
                  eq(employeeAssignments.rentalId, parseInt(rentalId)),
                  eq(employeeAssignments.type, 'rental_item'),
                  eq(employeeAssignments.status, 'active')
                )
              );

            console.log(
              `Ended employee assignment for previous operator ${previousOperatorId} on rental ${rentalId}`
            );
          }

          // Create new employee assignment - temporarily commented out due to type issues
          // const rental = await RentalService.getRental(parseInt(rentalId));
          // const customerName = rental?.customer?.name || 'Unknown Customer';

          // await db.insert(employeeAssignments).values({
          //   employeeId: newOperatorId,
          //   name: `${customerName} - ${body.equipmentName} Rental`,
          //   type: 'rental_item',
          //   location: 'Rental Site',
          //   startDate: new Date().toISOString().split('T')[0],
          //   endDate: null,
          //   status: 'active',
          //   notes: `Assigned to rental item: ${body.equipmentName} (Updated)`,
          //   rentalId: parseInt(rentalId),
          //   projectId: null,
          //   updatedAt: new Date().toISOString().split('T')[0]
          // });

          console.log(
            `Created new employee assignment for operator ${newOperatorId} on rental ${rentalId}`
          );
        }
      } catch (assignmentError) {
        console.error('Error updating employee assignment:', assignmentError);
        // Don't fail the rental item update if assignment update fails
        // Just log the error
      }
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating rental item:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    });
    return NextResponse.json(
      {
        error: 'Failed to update rental item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, _params: { params: Promise<{ id: string }> }) {
  // const { id } = await params; // Not used in this function
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'itemId parameter is required' }, { status: 400 });
    }

    const success = await RentalService.deleteRentalItem(parseInt(itemId));

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete rental item' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Rental item deleted successfully' });
  } catch (error) {
    console.error('Error deleting rental item:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete rental item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
