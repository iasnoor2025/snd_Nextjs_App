import { db } from '@/lib/drizzle';
import { rentalItems, rentals } from '@/lib/drizzle/schema';
import { RentalService } from '@/lib/services/rental-service';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rental = await RentalService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Fetch rental items separately
    const rentalItems = await RentalService.getRentalItems(parseInt(id));
    
    // Combine rental data with rental items
    const rentalWithItems = {
      ...rental,
      rentalItems: rentalItems
    };

    return NextResponse.json(rentalWithItems);
  } catch (error) {
    console.error('Error fetching rental:', error);
    return NextResponse.json({ error: 'Failed to fetch rental' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }

    if (!body.startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }

    // Get current rental to preserve existing status and paymentStatus if not provided
    const currentRental = await RentalService.getRental(parseInt(id));
    if (!currentRental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Set update data - preserve existing status/paymentStatus if not explicitly provided
    const updateData: any = {
      customerId: parseInt(body.customerId),
      rentalNumber: body.rentalNumber,
      startDate: new Date(body.startDate),
      expectedEndDate: body.expectedEndDate ? new Date(body.expectedEndDate) : null,
      actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : null,
      status: body.status !== undefined ? body.status : currentRental.status,
      paymentStatus: body.paymentStatus !== undefined ? body.paymentStatus : currentRental.paymentStatus,
      subtotal: parseFloat(body.subtotal) || 0,
      taxAmount: parseFloat(body.taxAmount) || 0,
      totalAmount: parseFloat(body.totalAmount) || 0,
      discount: parseFloat(body.discount) || 0,
      tax: parseFloat(body.tax) || 0,
      finalAmount: parseFloat(body.finalAmount) || 0,
      depositAmount: parseFloat(body.depositAmount) || 0,
      paymentTermsDays: parseInt(body.paymentTermsDays) || 30,
      hasTimesheet: body.hasTimesheet || false,
      hasOperators: body.hasOperators || false,
      supervisor: body.supervisor || null,
      area: body.area || null,
      notes: body.notes || '',
    };

    // Only include rentalItems if explicitly provided - otherwise preserve existing items
    if (body.rentalItems !== undefined) {
      updateData.rentalItems = body.rentalItems;
    }

    const rental = await RentalService.updateRental(parseInt(id), updateData);

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    return NextResponse.json(rental);
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to update rental' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rentalId = parseInt(id);

    // Get assignment count before deletion for reporting
    const assignmentCounts = await RentalService.deleteAllRentalAssignments(rentalId);
    
    // Delete rental items and rental itself
    await db.delete(rentalItems).where(eq(rentalItems.rentalId, rentalId));
    await db.delete(rentals).where(eq(rentals.id, rentalId));

    return NextResponse.json({ 
      success: true,
      message: 'Rental and all associated data deleted successfully',
      deletedData: {
        rental: 1,
        employeeAssignments: assignmentCounts.employeeAssignments,
        equipmentAssignments: assignmentCounts.equipmentAssignments,
        rentalItems: 'all'
      }
    });
  } catch (error) {
    console.error('Error deleting rental:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete rental',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
