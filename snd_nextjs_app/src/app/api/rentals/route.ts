import { PermissionConfigs, withReadPermission } from '@/lib/rbac/api-middleware';
import { RentalService } from '@/lib/services/rental-service';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withReadPermission(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const paymentStatus = searchParams.get('paymentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};
    if (search) filters.search = search;
    if (status && status !== 'all') filters.status = status;
    if (customerId) filters.customerId = customerId;
    if (paymentStatus && paymentStatus !== 'all') filters.paymentStatus = paymentStatus;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const rentals = await RentalService.getRentals(filters);
    return NextResponse.json(rentals);
  } catch (error) {
    console.error('Error fetching rentals:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to fetch rentals',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.rental.read);

export const POST = withReadPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Generate rental number if not provided
    if (!body.rentalNumber) {
      const timestamp = Date.now();
      body.rentalNumber = `RENT-${timestamp}`;
    }

    // Validate required fields
    if (!body.customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }

    if (!body.startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }

    // Set default values
    const rentalData: any = {
      customerId: parseInt(body.customerId),
      rentalNumber: body.rentalNumber,
      startDate: new Date(body.startDate),
      status: body.status || 'pending',
      paymentStatus: body.paymentStatus || 'pending',
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
      notes: body.notes || '',
      rentalItems: body.rentalItems || [],
    };

    // Add optional date fields only if they exist
    if (body.expectedEndDate) {
      rentalData.expectedEndDate = new Date(body.expectedEndDate);
    }
    if (body.actualEndDate) {
      rentalData.actualEndDate = new Date(body.actualEndDate);
    }

    const rental = await RentalService.createRental(rentalData);
    return NextResponse.json(rental, { status: 201 });
  } catch (error) {
    console.error('Error creating rental:', error);
    return NextResponse.json({ error: 'Failed to create rental' }, { status: 500 });
  }
}, PermissionConfigs.rental.create);
