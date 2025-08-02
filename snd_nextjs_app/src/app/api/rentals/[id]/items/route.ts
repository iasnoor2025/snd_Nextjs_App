import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const rentalId = params.id;

    console.log('Received rental item data:', body);

    // Check if rental exists
    const rentalExists = await DatabaseService.getRental(parseInt(rentalId));
    if (!rentalExists) {
      return NextResponse.json(
        { error: `Rental with ID ${rentalId} not found` },
        { status: 404 }
      );
    }

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

    // Add rental item
    const rentalItem = await DatabaseService.addRentalItem({
      rentalId: parseInt(rentalId),
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

    // If an operator is assigned, create an employee assignment
    if (body.operatorId && rentalItem) {
      try {
        // Get rental details for assignment name
        const rental = await DatabaseService.getRental(parseInt(rentalId));
        const customerName = rental?.customer?.name || 'Unknown Customer';
        
        // Create employee assignment
        await prisma.employeeAssignment.create({
          data: {
            employee_id: parseInt(body.operatorId),
            name: `${customerName} - ${body.equipmentName} Rental`,
            type: 'rental_item',
            location: rental?.location?.name || 'Unknown Location',
            start_date: new Date(),
            end_date: null,
            status: 'active',
            notes: `Assigned to rental item: ${body.equipmentName}`,
            rental_id: parseInt(rentalId),
            project_id: null,
          },
        });

        console.log(`Employee assignment created for operator ${body.operatorId} on rental ${rentalId}`);
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
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { 
        error: 'Failed to add rental item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rentalId = params.id;
    const rentalItems = await DatabaseService.getRentalItems(parseInt(rentalId));
    return NextResponse.json(rentalItems);
  } catch (error) {
    console.error('Error fetching rental items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental items' },
      { status: 500 }
    );
  }
} 