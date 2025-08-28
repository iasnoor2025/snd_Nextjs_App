import { db } from '@/lib/db';
import { employeeAssignments } from '@/lib/drizzle/schema';
import { RentalService } from '@/lib/services/rental-service';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { EquipmentStatusService } from '@/lib/services/equipment-status-service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const rentalId = id;

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

    // Calculate total price based on rate type and duration
    let totalPrice = parseFloat(body.totalPrice || body.unitPrice);
    
    // If we have start and end dates, calculate based on duration
    if (rentalExists.startDate && rentalExists.expectedEndDate) {
      const startDate = new Date(rentalExists.startDate);
      const endDate = new Date(rentalExists.expectedEndDate);
      const rateType = body.rateType || 'daily';
      
      if (rateType === 'hourly') {
        const hoursDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
        totalPrice = parseFloat(body.unitPrice) * hoursDiff;
      } else if (rateType === 'weekly') {
        const weeksDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
        totalPrice = parseFloat(body.unitPrice) * weeksDiff;
      } else if (rateType === 'monthly') {
        const monthsDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        totalPrice = parseFloat(body.unitPrice) * monthsDiff;
      } else {
        // Daily rate - calculate days
        const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        totalPrice = parseFloat(body.unitPrice) * daysDiff;
      }
    }

    // Add rental item
    const rentalItem = await RentalService.addRentalItem({
      rentalId: parseInt(rentalId),
      equipmentId: body.equipmentId ? parseInt(body.equipmentId) : null,
      equipmentName: body.equipmentName,
      unitPrice: parseFloat(body.unitPrice),
      totalPrice: totalPrice,
      rateType: body.rateType || 'daily',
      operatorId: body.operatorId ? parseInt(body.operatorId) : null,
      status: body.status || 'active',
      notes: body.notes || '',
    });

    // If an operator is assigned, create an employee assignment
    if (body.operatorId && rentalItem) {
      try {
        // Create employee assignment for rental
        await db.insert(employeeAssignments).values({
          employeeId: parseInt(body.operatorId),
          rentalId: parseInt(rentalId),
          startDate: new Date().toISOString().split('T')[0],
          endDate: null,
          status: 'active',
          notes: `Assigned to rental item: ${body.equipmentName}`,
          location: 'Rental Site',
          name: `Rental Assignment - ${body.equipmentName}`,
          type: 'rental',
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        });

      } catch (assignmentError) {
        console.error('Failed to create employee assignment:', assignmentError);
        // Don't fail the rental item creation if assignment creation fails
        // Just log the error
      }
    }

    // If equipment is assigned, create equipment assignment
    if (body.equipmentId && rentalItem) {
      try {
        const rental = await RentalService.getRental(parseInt(rentalId));
        if (rental?.startDate) {
          const startDate = new Date(rental.startDate);
          const endDate = rental.expectedEndDate ? new Date(rental.expectedEndDate) : undefined;
          
          await RentalService.createEquipmentAssignment(
            parseInt(rentalId),
            parseInt(body.equipmentId),
            parseFloat(body.unitPrice),
            totalPrice,
            startDate,
            endDate
          );
          
          // Immediately update equipment status to 'assigned'
          await EquipmentStatusService.onAssignmentCreated(parseInt(body.equipmentId));
        }
      } catch (equipmentError) {
        console.error('Failed to create equipment assignment:', equipmentError);
        // Don't fail the rental item creation if equipment assignment creation fails
        // Just log the error
      }
    }

    return NextResponse.json(rentalItem, { status: 201 });
  } catch (error) {

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
    
    return NextResponse.json({ error: 'Failed to fetch rental items' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const rentalId = id;

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

    // Calculate total price based on rate type and duration
    let totalPrice = parseFloat(body.totalPrice || body.unitPrice);
    
    // If we have start and end dates, calculate based on duration
    if (rentalExists.startDate && rentalExists.expectedEndDate) {
      const startDate = new Date(rentalExists.startDate);
      const endDate = new Date(rentalExists.expectedEndDate);
      const rateType = body.rateType || 'daily';
      
      if (rateType === 'hourly') {
        const hoursDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
        totalPrice = parseFloat(body.unitPrice) * hoursDiff;
      } else if (rateType === 'weekly') {
        const weeksDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
        totalPrice = parseFloat(body.unitPrice) * weeksDiff;
      } else if (rateType === 'monthly') {
        const monthsDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        totalPrice = parseFloat(body.unitPrice) * monthsDiff;
      } else {
        // Daily rate - calculate days
        const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        totalPrice = parseFloat(body.unitPrice) * daysDiff;
      }
    }

    // Update rental item
    const updatedItem = await RentalService.updateRentalItem(parseInt(body.itemId), {
      equipmentId: body.equipmentId ? parseInt(body.equipmentId) : null,
      equipmentName: body.equipmentName,
      unitPrice: parseFloat(body.unitPrice),
      totalPrice: totalPrice,
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
                  eq(employeeAssignments.status, 'active')
                )
              );

          }

          // Create new employee assignment for rental
          await db.insert(employeeAssignments).values({
            employeeId: newOperatorId,
            rentalId: parseInt(rentalId),
            startDate: new Date().toISOString().split('T')[0],
            endDate: null,
            status: 'active',
            notes: `Assigned to rental item: ${body.equipmentName} (Updated)`,
            location: 'Rental Site',
            name: `Rental Assignment - ${body.equipmentName}`,
            type: 'rental',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          });

        }
      } catch (assignmentError) {
        
        // Don't fail the rental item update if assignment update fails
        // Just log the error
      }
    }

    return NextResponse.json(updatedItem);
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
    
    return NextResponse.json(
      {
        error: 'Failed to delete rental item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
